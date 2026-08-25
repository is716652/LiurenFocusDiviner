# -*- coding: utf-8 -*-
"""补丁：YongShenSheet
1) yongShen 变化 @Watch 强制刷新（三传/四课重建）
2) 四课注明「右边是第一课」
"""
import io

P = r'D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\LiurenFocusDiviner\entry\src\main\ets\components\YongShenSheet.ets'

def main():
    s = io.open(P, encoding='utf-8').read()

    # ① @Prop yongShen 加 @Watch
    old = """  /* 状态（由父级持有，受控） */
  @Prop affairName: string = '';
  @Prop yongShen: string = '';
  @Prop anchor: string = '';"""
    assert s.count(old) == 1, 'prop: %d' % s.count(old)
    new = """  /* 状态（由父级持有，受控） */
  @Prop affairName: string = '';
  @Prop @Watch('onYSChange') yongShen: string = '';
  @Prop anchor: string = '';
  /* 用神变化刷新标记（强制 Swiper 子页重建） */
  @State refreshTick: number = 0;"""
    s = s.replace(old, new)

    # ② @Watch 方法（加在回调后）
    old_cb = """  /* 外应取用：迷你盘点击 → 回传父级统一处理 */
  onPickZhi: (zhi: string, layer: string) => void = () => { };
"""
    assert s.count(old_cb) == 1, 'cb: %d' % s.count(old_cb)
    new_cb = old_cb + """
  /* 用神变化：强制迷你三传/四课重建 */
  private onYSChange(): void {
    this.refreshTick = this.refreshTick + 1;
  }
"""
    s = s.replace(old_cb, new_cb)

    # ③ 三传 key 加 refreshTick
    old_t = """                  }, (tr: MiniChuanRow) => 'mr' + tr.pos)"""
    assert s.count(old_t) == 1, 't: %d' % s.count(old_t)
    new_t = """                  }, (tr: MiniChuanRow) => 'mr' + this.refreshTick + tr.pos)"""
    s = s.replace(old_t, new_t)

    # ④ 四课 key 加 refreshTick
    old_k = """                    }, (kr: MiniKegRow) => 'kr' + kr.kn)"""
    assert s.count(old_k) == 1, 'k: %d' % s.count(old_k)
    new_k = """                    }, (kr: MiniKegRow) => 'kr' + this.refreshTick + kr.kn)"""
    s = s.replace(old_k, new_k)

    # ⑤ 四课注明「右边是第一课」
    old_note = """                  Text('四课（天将/上神/下神）· 左右滑切')"""
    assert s.count(old_note) == 1, 'note: %d' % s.count(old_note)
    new_note = """                  Text('四课（右边是第一课 · 天将/上神/下神）· 左右滑切')"""
    s = s.replace(old_note, new_note)

    io.open(P, 'w', encoding='utf-8', newline='').write(s)
    print('YS REFRESH PATCH OK')

if __name__ == '__main__':
    main()