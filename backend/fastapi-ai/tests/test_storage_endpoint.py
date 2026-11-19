"""S3-compatible storage (Google Cloud Storage): the endpoint is used, and account deletion removes
files one by one because GCS has no batch delete. boto3 is faked: no network."""
import sys
import types

from app.storage import s3 as storage


class FakeObj:
    def __init__(self, store, key):
        self.store, self.key = store, key

    def delete(self):
        self.store.remove(self.key)


class FakeObjects(list):
    def delete(self):  # AWS batch delete
        raise AssertionError("batch delete is not supported by this store")


def fake_boto(calls, store):
    class Bucket:
        def __init__(self, name):
            class Objs:
                @staticmethod
                def filter(Prefix):
                    return FakeObjects(FakeObj(store, k) for k in list(store) if k.startswith(Prefix))

            self.objects = Objs()

    def client(name, **kw):
        calls.append(("client", kw))
        return types.SimpleNamespace(put_object=lambda **o: store.append(o["Key"]))

    def resource(name, **kw):
        calls.append(("resource", kw))
        return types.SimpleNamespace(Bucket=Bucket)

    return types.SimpleNamespace(client=client, resource=resource)


def test_gcs_endpoint_and_one_by_one_delete(monkeypatch):
    calls, store = [], []
    monkeypatch.setitem(sys.modules, "boto3", fake_boto(calls, store))
    monkeypatch.setattr(storage.settings, "s3_bucket", "azarvis-files")
    monkeypatch.setattr(storage.settings, "s3_endpoint_url", "https://storage.googleapis.com")
    uri = storage.save_file("gcs-user", "notes.pdf", b"%PDF")
    storage.save_file("other-user", "keep.pdf", b"%PDF")
    assert uri.startswith("s3://azarvis-files/uploads/gcs-user/")
    assert calls[0] == ("client", {"region_name": storage.settings.aws_region, "endpoint_url": "https://storage.googleapis.com"})
    assert storage.delete_user_files("gcs-user") == 1
    assert [k for k in store if "gcs-user" in k] == [] and len(store) == 1
