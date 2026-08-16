import os
import json
import base64
import hashlib
from pathlib import Path
from cryptography.hazmat.primitives.asymmetric import ed25519
from cryptography.hazmat.primitives import serialization

class TraceSigner:
    def __init__(self, key_path: Path):
        self.key_path = key_path
        if not key_path.exists():
            private_key = ed25519.Ed25519PrivateKey.generate()
            private_bytes = private_key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.PKCS8,
                encryption_algorithm=serialization.NoEncryption()
            )
            key_path.write_bytes(private_bytes)
            self.private_key = private_key
        else:
            self.private_key = serialization.load_pem_private_key(
                key_path.read_bytes(),
                password=None
            )
        self.public_key = self.private_key.public_key()

    def sign(self, data: bytes) -> str:
        signature = self.private_key.sign(data)
        return base64.b64encode(signature).decode('utf-8')

    def verify(self, data: bytes, signature: str) -> bool:
        try:
            self.public_key.verify(base64.b64decode(signature), data)
            return True
        except Exception:
            return False

class TraceLog:
    def __init__(self, log_path: Path, signer: TraceSigner):
        self.log_path = log_path
        self.signer = signer
        self._last_hash = '0'*64
        if self.log_path.exists():
            lines = self.log_path.read_text().strip().split('\n')
            if lines and lines[0]:
                last_line = json.loads(lines[-1])
                self._last_hash = hashlib.sha256(json.dumps(last_line, sort_keys=True).encode()).hexdigest()

    def append(self, trace_data: dict):
        payload_str = json.dumps(trace_data, sort_keys=True)
        data_to_sign = f'{self._last_hash}:{payload_str}'.encode('utf-8')
        signature = self.signer.sign(data_to_sign)
        
        entry = {
            'payload': trace_data,
            'prev_hash': self._last_hash,
            'signature': signature
        }
        
        entry_str = json.dumps(entry, sort_keys=True)
        with open(self.log_path, 'a') as f:
            f.write(entry_str + '\n')
            
        self._last_hash = hashlib.sha256(entry_str.encode('utf-8')).hexdigest()

    def verify_chain(self):
        if not self.log_path.exists():
            return True, None
            
        last_hash = '0'*64
        with open(self.log_path, 'r') as f:
            for i, line in enumerate(f):
                line = line.strip()
                if not line:
                    continue
                try:
                    entry = json.loads(line)
                    if entry['prev_hash'] != last_hash:
                        return False, f'Broken chain at line {i+1}: prev_hash mismatch'
                    
                    payload_str = json.dumps(entry['payload'], sort_keys=True)
                    data_to_sign = f'{last_hash}:{payload_str}'.encode('utf-8')
                    if not self.signer.verify(data_to_sign, entry['signature']):
                        return False, f'Invalid signature at line {i+1}'
                        
                    last_hash = hashlib.sha256(line.encode('utf-8')).hexdigest()
                except Exception as e:
                    return False, f'Parse error at line {i+1}: {e}'
        return True, None
