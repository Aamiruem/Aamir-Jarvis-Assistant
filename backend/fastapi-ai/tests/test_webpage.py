"""Adding a web page to the knowledge base: text extraction and the local-network guard."""
import pytest

from app.rag.webpage import PageError, check_url, html_to_text

PAGE = """<html><head><title>Aamir | Portfolio</title><meta name="description" content="AI/ML engineer.">
<style>body{color:red}</style><script>var secret = 1;</script></head>
<body><h1>About me</h1><p>I build <b>ML</b> apps.</p><svg><title>chart caption</title></svg><p>Gurugram</p></body></html>"""


def test_html_to_text_keeps_content_and_drops_code():
    title, text = html_to_text(PAGE)
    assert title == "Aamir | Portfolio"
    assert text.startswith("AI/ML engineer.") and "About me" in text and "I build ML apps." in text
    assert "secret" not in text and "color:red" not in text and "chart caption" not in text


@pytest.mark.parametrize("url", ["http://127.0.0.1:8001/health", "http://localhost:4000/api", "http://10.0.0.5/", "http://192.168.1.1/", "file:///etc/passwd", "ftp://example.com/x"])
def test_local_and_non_web_addresses_are_refused(url):
    with pytest.raises(PageError):
        check_url(url)
