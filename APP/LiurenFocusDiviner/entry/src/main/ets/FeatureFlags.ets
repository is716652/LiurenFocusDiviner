/**
 * FeatureFlags —— 版本形态开关（主/收费版为真；免费上架版由同步脚本置假）
 * ----------------------------------------------------------------------------
 * 原则：免费上架版可携带代码/数据，但不显示入口、不出现付费痕迹；
 * 是否开放由同步脚本在生成免费版时统一翻转，避免业务页面到处写版本判断。
 */
export class FeatureFlags {
  /* 收费研习内容（古籍页「剧情演绎」页签：古籍剧情 + 偶遇实盘）：
     主版/收费版显示；免费上架版隐藏页签入口，且其数据（case_story / ouyu_cases）
     由 sync_free_edition 物理剔除，随包发出等于公开收费内容。
     名称沿用 SHOW_ANCIENT_CASE_GALLERY（同步脚本按此名写入 false），语义已扩为「收费研习内容」。 */
  static readonly SHOW_ANCIENT_CASE_GALLERY: boolean = true;
}
