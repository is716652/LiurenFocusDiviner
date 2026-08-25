# -*- coding: utf-8 -*-
"""把明文密码加密为 hvigor 可解密的密文（DevEco 密码加密算法逆向）
hvigor DecipherUtil.decryptPwd(materialDir, cipherHex, tag):
  - 密钥 = pbkdf2(rootKey, salt, 10000, 16, sha256)
    rootKey = xor(fd 三个文件内容, component)  其中 component = [49,243,9,115,214,175,91,184,211,190,177,88,101,131,192,119]
    salt = ac 文件内容
  - 密文 = AES-128-GCM(key, iv=nonce, tag)
  - 格式: [4字节明文长度][nonce][ciphertext][16字节tag] → hex
本脚本：输入明文密码 + material 目录 → 输出 hex 密文（≥32字符）
用法: python encrypt_pwd.py <明文密码> <material目录>
"""
import hashlib
import sys
import os

COMPONENT = bytes([49, 243, 9, 115, 214, 175, 91, 184, 211, 190, 177, 88, 101, 131, 192, 119])

def xor_bytes(a, b):
    return bytes(x ^ y for x, y in zip(a, b))

def read_material(material_dir):
    ac = None
    ce = None
    fds = []
    for root, dirs, files in os.walk(material_dir):
        rel = os.path.relpath(root, material_dir)
        for f in files:
            p = os.path.join(root, f)
            data = open(p, 'rb').read()
            if rel == 'ac':
                ac = data
            elif rel == 'ce':
                ce = data
            elif rel.startswith('fd'):
                fds.append(data)
    if ac is None or ce is None or len(fds) != 3:
        raise SystemExit('material 目录必须含 ac/ce/fd(3个文件): ' + material_dir)
    fds.sort()
    return ac, ce, fds

def derive_key(ac, fds):
    # rootKey = xor(fd0, fd1, fd2, component)
    rk = fds[0]
    for i in range(1, len(fds)):
        rk = xor_bytes(rk, fds[i])
    rk = xor_bytes(rk, COMPONENT)
    # key = pbkdf2(sha256(rk), ac, 10000, 16)
    return hashlib.pbkdf2_hmac('sha256', rk, ac, 10000, 16)

def encrypt_pwd(plain, material_dir):
    import os
    ac, ce, fds = read_material(material_dir)
    key = derive_key(ac, fds)
    # AES-128-GCM 加密：随机 nonce(12B) + 密文 + tag(16B)
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    nonce = os.urandom(12)
    aesgcm = AESGCM(key)
    ct = aesgcm.encrypt(nonce, plain.encode('utf-8'), None)
    # 格式：[4字节密文长度][nonce][ciphertext][tag]
    tag = ct[-16:]
    body = ct[:-16]
    out = len(body).to_bytes(4, 'big') + nonce + body + tag
    return out.hex()

def main():
    if len(sys.argv) < 3:
        raise SystemExit('用法: python encrypt_pwd.py <明文密码> <material目录>')
    plain = sys.argv[1]
    mat = sys.argv[2]
    hexed = encrypt_pwd(plain, mat)
    print('明文:', plain)
    print('密文:', hexed)
    print('长度:', len(hexed))
    if len(hexed) < 32:
        print('WARN: 密文不足32字符')

if __name__ == '__main__':
    main()
