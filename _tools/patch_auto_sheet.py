# -*- coding: utf-8 -*-
"""补丁：Index.ets pickCustomZhi 自动弹出抓用神 Sheet"""
import io

P = r'D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\LiurenFocusDiviner\entry\src\main\ets\pages\Index.ets'

def main():
    s = io.open(P, encoding='utf-8').read()

    old = """      this.xingnian = LiurenCore.xingNian(c, this.birthYear, this.year, this.gender, this.yongShen);
    }
  }

  /* 解锁毕法研习内容（带结果提示） */"""
    assert s.count(old) == 1, 'old: %d' % s.count(old)
    new = """      this.xingnian = LiurenCore.xingNian(c, this.birthYear, this.year, this.gender, this.yongShen);
    }
    /* 自动弹出抓用神，告知所选用神（迷你盘同步显示） */
    this.showYongShen = true;
  }

  /* 解锁毕法研习内容（带结果提示） */"""
    s = s.replace(old, new)

    io.open(P, 'w', encoding='utf-8', newline='').write(s)
    print('AUTO SHEET PATCH OK')

if __name__ == '__main__':
    main()
