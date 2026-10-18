from datetime import datetime

from django.utils import timezone

from apps.geodata.models import Advisory, DataSource, ForecastSnapshot, GridCell


def get_or_create_datasource(slug: str, name: str) -> DataSource:
    ds, _ = DataSource.objects.get_or_create(slug=slug, defaults={"name": name, "is_enabled": True})
    return ds


def ingest_for_cell(adapter, lat: float, lon: float) -> int:
    """Fetches data from an adapter, normalises it, and saves ForecastSnapshots idempotently."""
    ds = get_or_create_datasource(adapter.slug, adapter.name)
    if not adapter.is_available():
        return 0

    cell = GridCell.nearest(lat, lon)
    raw_records = adapter.fetch(cell.lat, cell.lon)
    count = 0

    for raw in raw_records:
        normalised_list = adapter.normalise(raw)
        for norm in normalised_list:
            ForecastSnapshot.objects.update_or_create(
                cell=cell,
                source=ds,
                valid_time=norm.valid_time,
                issued_at=norm.issued_at,
                defaults={"values": norm.values},
            )
            count += 1

    ds.last_success_at = timezone.now()
    ds.last_error = ""
    ds.save(update_fields=["last_success_at", "last_error"])
    return count


def get_snapshots_for_point_window(
    lat: float, lon: float, valid_from: datetime, valid_to: datetime
) -> list[ForecastSnapshot]:
    """Retrieves forecast snapshots for the nearest cell within the specified time window."""
    cell = GridCell.nearest(lat, lon)
    return list(
        ForecastSnapshot.objects.filter(
            cell=cell,
            valid_time__gte=valid_from,
            valid_time__lte=valid_to,
        )
        .select_related("source")
        .order_by("valid_time")
    )


def get_active_advisories_for_point(lat: float, lon: float) -> list[Advisory]:
    """Retrieves active advisories whose bounding box encompasses the query point."""
    now = timezone.now()
    candidates = Advisory.objects.filter(
        expires_at__gt=now,
        min_lat__lte=lat,
        max_lat__gte=lat,
        min_lon__lte=lon,
        max_lon__gte=lon,
    ).select_related("source")
    return list(candidates)


def get_advisories_queryset(
    active_only: bool = True,
    severity: str | None = None,
    search: str | None = None,
    ordering: str = "-issued_at",
    near: tuple[float, float] | None = None,
    source_slug: str | None = None,
):
    """Queryset for advisories table supporting filtering, search, spatial near, and ordering."""
    qs = Advisory.objects.select_related("source").all()
    if active_only:
        qs = qs.filter(expires_at__gt=timezone.now())
    if severity:
        qs = qs.filter(severity=severity)
    if source_slug:
        qs = qs.filter(source__slug=source_slug)
    if search:
        qs = qs.filter(headline__icontains=search)
    if near:
        lat, lon = near
        qs = qs.filter(
            min_lat__lte=lat,
            max_lat__gte=lat,
            min_lon__lte=lon,
            max_lon__gte=lon,
        )

    allowed_orderings = ["issued_at", "-issued_at", "expires_at", "-expires_at", "severity", "-severity"]
    if ordering in allowed_orderings:
        qs = qs.order_by(ordering)
    else:
        qs = qs.order_by("-issued_at")

    return qs
