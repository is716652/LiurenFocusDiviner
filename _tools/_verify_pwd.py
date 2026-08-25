# -*- coding: utf-8 -*-
"""验证密码加密/解密与 hvigor DecipherUtil 一致
1. 用同款算法解出 debug 签名（.ohos/config）的明文密码
2. 用 encrypt 逻辑重新加密，对比是否还原出原密文
"""
import hashlib
import os

COMPONENT = bytes([49, 243, 9, 115, 214, 175, 91, 184, 211, 190, 177, 88, 101, 131, 192, 119])

def xor_bytes(a, b):
    return bytes(x ^ y for x, y in zip(a, b))

def read_material(material_dir):
    """material_dir 应指向 .../material（含 ac/ce/fd 子目录）"""
    ac = ce = None
    fds = []
    for root, dirs, files in os.walk(material_dir):
        rel = os.path.relpath(root, material_dir)
        for f in files:
            data = open(os.path.join(root, f), 'rb').read()
            if rel == 'ac':
                ac = data
            elif rel == 'ce':
                ce = data
            elif rel.startswith('fd'):
                fds.append(data)
    if ac is None or ce is None or len(fds) != 3:
        raise SystemExit('material 目录需含 ac/ce/fd(3个文件): %s (ac=%s ce=%s fd=%d)'
                         % (material_dir, ac is not None, ce is not None, len(fds)))
    fds.sort()
    return ac, ce, fds

def derive_key(ac, fds):
    rk = fds[0]
    for i in range(1, len(fds)):
        rk = xor_bytes(rk, fds[i])
    rk = xor_bytes(rk, COMPONENT)
    return hashlib.pbkdf2_hmac('sha256', rk, ac, 10000, 16)

def decrypt_pwd(cipher_hex, material_dir):
    ac, ce, fds = read_material(material_dir)
    key = derive_key(ac, fds)
    raw = bytes.fromhex(cipher_hex)
    ln = int.from_bytes(raw[0:4], 'big')
    nonce = raw[4:16]
    body = raw[16:16 + ln]
    tag = raw[16 + ln:16 + ln + 16]
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    pt = AESGCM(key).decrypt(nonce, body + tag, None)
    return pt.decode('utf-8')

def encrypt_pwd(plain, material_dir):
    ac, ce, fds = read_material(material_dir)
    key = derive_key(ac, fds)
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    nonce = os.urandom(12)
    ct = AESGCM(key).encrypt(nonce, plain.encode('utf-8'), None)
    tag = ct[-16:]
    body = ct[:-16]
    out = len(body).to_bytes(4, 'big') + nonce + body + tag
    return out.hex()

if __name__ == '__main__':
    # debug 签名密文（来自 build-profile.json5）
    debug_pwd = '0000001BD47E52FB6ACC18408CEABE06E6815AD4B432443FA13ADD5FD1F1B694CD4B9CD7D0B759F53C6584'
    mat = r'C:\Users\is716\.ohos\config'
    plain = decrypt_pwd(debug_pwd, mat)
    print('debug 明文密码:', plain)
    # 重新加密 → 再解密验证往返一致
    re_hex = encrypt_pwd(plain, mat)
    re_plain = decrypt_pwd(re_hex, mat)
    print('往返一致:', re_plain == plain, '| 密文长度:', len(re_hex))
    # 我们的 p12 密码加密
    app_mat = r'D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\APPCerts'
    app_hex = encrypt_pwd('Xv2010wr__', app_mat)
    print('APPCerts 密文:', app_hex, 'len', len(app_hex))
    # 验证 APPCerts 密文可解回
    back = decrypt_pwd(app_hex, app_mat)
    print('APPCerts 往返:', back == 'Xv2010wr__')
