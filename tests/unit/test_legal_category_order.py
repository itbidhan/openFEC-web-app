from openfecwebapp.views import get_legal_category_order

def test_legal_category_order():
    results = {
        "total_statutes": 0,
        "total_advisory_opinions": 12,
        "total_murs": 10,
    }

    assert get_legal_category_order(results, murs_enabled=True) == [
        "advisory_opinions", "murs", "statutes", "regulations"]

    assert get_legal_category_order(results, murs_enabled=False) == [
        "advisory_opinions", "statutes", "regulations", "murs"]
