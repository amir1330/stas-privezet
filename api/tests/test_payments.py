from app.services.payments import ManualPaymentProvider, PaymentStatus


async def test_manual_payment_intent():
    provider = ManualPaymentProvider()
    import uuid

    oid = uuid.uuid4()
    intent = await provider.create_intent(oid, 150000.0)
    assert intent.status == PaymentStatus.PENDING
    assert "manual" in intent.provider_ref

    confirmed = await provider.confirm(intent.provider_ref)
    assert confirmed.status == PaymentStatus.SUCCEEDED
