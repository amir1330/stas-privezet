
from app.services.cache import _pattern_to_prefix, products_cache_key


def test_pattern_to_prefix():
    assert _pattern_to_prefix("catalog:*") == "catalog:"
    assert _pattern_to_prefix("homepage:*") == "homepage:"


def test_products_cache_key_stable():
    k1 = products_cache_key(category="sneakers", cursor=None)
    k2 = products_cache_key(category="sneakers", cursor=None)
    assert k1 == k2
    assert k1.startswith("catalog:products:")
