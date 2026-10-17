from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.core.models import PublicIdModel, TimeStampedModel


class UserManager(BaseUserManager):
    """Custom manager enforcing case-insensitive email lookup and creation."""

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError(_("The Email field must be set"))
        email = self.normalize_email(email).lower()
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_email_verified", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError(_("Superuser must have is_staff=True."))
        if extra_fields.get("is_superuser") is not True:
            raise ValueError(_("Superuser must have is_superuser=True."))

        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin, TimeStampedModel, PublicIdModel):
    """
    Custom user model for ORCA.
    Email is used as the primary identifier; public_id UUID is exposed externally.
    """

    class UnitsChoice(models.TextChoices):
        METRIC = "metric", _("Metric (m, km/h, °C)")
        KNOTS = "knots", _("Nautical (knots, m, °C)")

    class VesselChoice(models.TextChoices):
        SMALL_CRAFT = "small_craft", _("Small Craft (FRP boat, canoe)")
        MECHANISED = "mechanised", _("Mechanised (Trawler, gillnetter)")

    email = models.EmailField(_("email address"), unique=True, max_length=254, db_index=True)
    display_name = models.CharField(_("display name"), max_length=80)
    is_email_verified = models.BooleanField(_("email verified"), default=False)
    preferred_units = models.CharField(
        _("preferred units"),
        max_length=10,
        choices=UnitsChoice.choices,
        default=UnitsChoice.METRIC,
    )
    default_vessel_class = models.CharField(
        _("default vessel class"),
        max_length=20,
        choices=VesselChoice.choices,
        null=True,
        blank=True,
    )

    is_active = models.BooleanField(_("active"), default=True)
    is_staff = models.BooleanField(_("staff status"), default=False)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["display_name"]

    class Meta:
        verbose_name = _("user")
        verbose_name_plural = _("users")
        indexes = [
            models.Index(fields=["email"], name="user_email_idx"),
            models.Index(fields=["public_id"], name="user_public_id_idx"),
        ]

    def __str__(self):
        return f"{self.display_name} <{self.email}>"

    def clean(self):
        super().clean()
        if self.email:
            self.email = self.email.lower()
