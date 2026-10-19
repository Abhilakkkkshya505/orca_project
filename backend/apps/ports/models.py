import math
import uuid

from django.db import models


class LocationPoint:
    """Lightweight representation of a geospatial point (lon, lat) in SRID 4326."""

    def __init__(self, lat: float, lon: float):
        self.lat = float(lat)
        self.lon = float(lon)
        self.x = self.lon
        self.y = self.lat

    def __getitem__(self, idx):
        return (self.lon, self.lat)[idx]

    def __iter__(self):
        return iter((self.lon, self.lat))

    def __len__(self):
        return 2

    def __eq__(self, other):
        if isinstance(other, LocationPoint):
            return abs(self.lat - other.lat) < 1e-5 and abs(self.lon - other.lon) < 1e-5
        if isinstance(other, dict):
            lat_val = other.get("lat") if "lat" in other else other.get("latitude")
            lon_val = other.get("lon") if "lon" in other else other.get("longitude")
            if lat_val is not None and lon_val is not None:
                return abs(self.lat - float(lat_val)) < 1e-5 and abs(self.lon - float(lon_val)) < 1e-5
        if isinstance(other, (list, tuple)) and len(other) == 2:
            return abs(self.lon - float(other[0])) < 1e-5 and abs(self.lat - float(other[1])) < 1e-5
        return False

    def __repr__(self):
        return f"SRID=4326;POINT ({self.lon} {self.lat})"

    def to_dict(self):
        return {"lat": self.lat, "lon": self.lon}


class Port(models.Model):
    """
    World Port and Coastal Landing Station.
    Complies with Task 1 specifications for worldwide ports and coastal navigation.
    """

    class PortType(models.TextChoices):
        COMMERCIAL = "commercial", "Commercial Port"
        FISHING_HARBOUR = "fishing_harbour", "Fishing Harbour"
        MINOR = "minor", "Minor Port"
        ANCHORAGE = "anchorage", "Anchorage"
        RIVER = "river", "River Port"
        OTHER = "other", "Other"

    public_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True, db_index=True)
    name = models.CharField(max_length=200, db_index=True)
    name_ascii = models.CharField(max_length=200, db_index=True)
    alt_names = models.JSONField(default=list, blank=True)
    slug = models.SlugField(max_length=255, unique=True, db_index=True)

    country_code = models.CharField(max_length=2, db_index=True)  # ISO 3166-1 alpha-2
    country_name = models.CharField(max_length=100, blank=True, default="")
    admin1_name = models.CharField(max_length=100, blank=True, default="", db_index=True)
    admin1_code = models.CharField(max_length=50, blank=True, default="")

    port_type = models.CharField(
        max_length=50,
        choices=PortType.choices,
        default=PortType.COMMERCIAL,
        db_index=True,
    )
    harbour_size = models.CharField(max_length=50, null=True, blank=True)
    unlocode = models.CharField(max_length=10, null=True, blank=True, db_index=True)

    # Coordinates stored as floating-point degrees
    lat = models.FloatField(db_index=True)
    lon = models.FloatField(db_index=True)

    # Nearest valid sea-point coordinates where marine forecast model data exists
    marine_lat = models.FloatField(null=True, blank=True, db_index=True)
    marine_lon = models.FloatField(null=True, blank=True, db_index=True)
    marine_offset_km = models.FloatField(null=True, blank=True)

    is_coastal = models.BooleanField(default=True, db_index=True)
    is_active = models.BooleanField(default=True, db_index=True)

    source = models.CharField(max_length=50, default="nga")  # nga, naturalearth, osm, in_gov, etc.
    source_ref = models.CharField(max_length=100, blank=True, default="")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        indexes = [
            models.Index(fields=["country_code"], name="ports_port_country_idx"),
            models.Index(fields=["country_code", "admin1_code"], name="ports_port_country_adm1_idx"),
            models.Index(fields=["is_active", "is_coastal"], name="ports_port_active_coast_idx"),
            models.Index(fields=["lat", "lon"], name="ports_port_lat_lon_idx"),
        ]

    def __str__(self):
        return f"{self.name} ({self.country_code}) [{self.slug}]"

    @property
    def location(self) -> LocationPoint:
        return LocationPoint(self.lat, self.lon)

    @location.setter
    def location(self, val):
        if isinstance(val, (list, tuple)) and len(val) == 2:
            self.lon, self.lat = float(val[0]), float(val[1])
        elif isinstance(val, dict):
            self.lat = float(val.get("lat") if "lat" in val else val.get("latitude"))
            self.lon = float(val.get("lon") if "lon" in val else val.get("longitude"))
        elif hasattr(val, "lat") and hasattr(val, "lon"):
            self.lat, self.lon = float(val.lat), float(val.lon)
        elif hasattr(val, "x") and hasattr(val, "y"):
            self.lon, self.lat = float(val.x), float(val.y)

    @property
    def marine_location(self) -> LocationPoint | None:
        if self.marine_lat is not None and self.marine_lon is not None:
            return LocationPoint(self.marine_lat, self.marine_lon)
        return None

    @marine_location.setter
    def marine_location(self, val):
        if val is None:
            self.marine_lat = None
            self.marine_lon = None
        elif isinstance(val, (list, tuple)) and len(val) == 2:
            self.marine_lon, self.marine_lat = float(val[0]), float(val[1])
        elif isinstance(val, dict):
            self.marine_lat = float(val.get("lat") if "lat" in val else val.get("latitude"))
            self.marine_lon = float(val.get("lon") if "lon" in val else val.get("longitude"))
        elif hasattr(val, "lat") and hasattr(val, "lon"):
            self.marine_lat, self.marine_lon = float(val.lat), float(val.lon)
        elif hasattr(val, "x") and hasattr(val, "y"):
            self.marine_lon, self.marine_lat = float(val.x), float(val.y)

    def distance_to(self, target_lat: float, target_lon: float) -> float:
        """Haversine distance calculation in kilometers."""
        r = 6371.0  # Earth radius in km
        dlat = math.radians(target_lat - self.lat)
        dlon = math.radians(target_lon - self.lon)
        a = (
            math.sin(dlat / 2.0) ** 2
            + math.cos(math.radians(self.lat)) * math.cos(math.radians(target_lat)) * math.sin(dlon / 2.0) ** 2
        )
        c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
        return r * c

    def bearing_to(self, target_lat: float, target_lon: float) -> float:
        """Initial compass bearing from self to target in degrees (0..360)."""
        lat1 = math.radians(self.lat)
        lat2 = math.radians(target_lat)
        dlon = math.radians(target_lon - self.lon)

        y = math.sin(dlon) * math.cos(lat2)
        x = math.cos(lat1) * math.sin(lat2) - math.sin(lat1) * math.cos(lat2) * math.cos(dlon)
        bearing = (math.degrees(math.atan2(y, x)) + 360.0) % 360.0
        return round(bearing, 1)
