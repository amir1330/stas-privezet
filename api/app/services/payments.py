"""Payment provider abstraction — swap Stripe/local gateway later without touching order model."""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from enum import StrEnum
from uuid import UUID


class PaymentStatus(StrEnum):
    PENDING = "pending"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    CANCELLED = "cancelled"


@dataclass
class PaymentIntent:
    provider_ref: str
    status: PaymentStatus
    amount_krw: float
    metadata: dict


class PaymentProvider(ABC):
    @abstractmethod
    async def create_intent(self, order_id: UUID, amount_krw: float, metadata: dict | None = None) -> PaymentIntent:
        ...

    @abstractmethod
    async def confirm(self, provider_ref: str) -> PaymentIntent:
        ...

    @abstractmethod
    async def cancel(self, provider_ref: str) -> PaymentIntent:
        ...


class ManualPaymentProvider(PaymentProvider):
    """Placeholder — support agents mark orders paid manually until a real gateway is wired."""

    async def create_intent(self, order_id: UUID, amount_krw: float, metadata: dict | None = None) -> PaymentIntent:
        return PaymentIntent(
            provider_ref=f"manual-{order_id}",
            status=PaymentStatus.PENDING,
            amount_krw=amount_krw,
            metadata=metadata or {},
        )

    async def confirm(self, provider_ref: str) -> PaymentIntent:
        return PaymentIntent(provider_ref=provider_ref, status=PaymentStatus.SUCCEEDED, amount_krw=0, metadata={})

    async def cancel(self, provider_ref: str) -> PaymentIntent:
        return PaymentIntent(provider_ref=provider_ref, status=PaymentStatus.CANCELLED, amount_krw=0, metadata={})


def get_payment_provider() -> PaymentProvider:
    return ManualPaymentProvider()
