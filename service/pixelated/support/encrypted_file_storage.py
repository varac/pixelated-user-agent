import io
import os

from whoosh.filedb.filestore import FileStorage

from whoosh.filedb.structfile import StructFile, BufferFile
from cryptography.fernet import Fernet
from whoosh.util import random_name


class EncryptedFileStorage(FileStorage):
    def __init__(self, path, masterkey=None):
        self.masterkey = masterkey
        self.f = Fernet(masterkey)
        self._tmp_storage = self.temp_storage
        FileStorage.__init__(self, path, supports_mmap=False)

    def open_file(self, name, **kwargs):
        return self._open_encrypted_file(name, onclose=self._encrypt_index_on_close(name))

    def create_file(self, name, excl=False, mode="w+b", **kwargs):
        f = StructFile(io.BytesIO(), name=name, onclose=self._encrypt_index_on_close(name))
        f.is_real = False
        return f

    def temp_storage(self, name=None):
        name = name or "%s.tmp" % random_name()
        path = os.path.join(self.folder, name)
        tempstore = EncryptedFileStorage(path, self.masterkey)
        return tempstore.create()

    def file_length(self, name):
        f = self._open_encrypted_file(name)
        length = len(f.file.read())
        f.close()
        return length

    def _encrypt_index_on_close(self, name):
        def wrapper(file_struct):
            file_struct.seek(0)
            content = file_struct.file.read()
            encrypted_content = self.f.encrypt(content)
            with open(self._fpath(name), 'w+b') as _f:
                _f.write(encrypted_content)
        return wrapper

    def _decrypt(self, file_content):
        return self.f.decrypt(file_content) if len(file_content) else file_content

    def _open_encrypted_file(self, name, onclose=lambda x: None):
        file_content = open(self._fpath(name), "rb").read()
        decrypted = self._decrypt(file_content)
        f = BufferFile(buffer(decrypted), name=name, onclose=onclose)
        return f
