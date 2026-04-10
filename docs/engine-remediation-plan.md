# Engine Remediation Plan

## P0
- [x] 建立規則版本號與規則分級基礎模組
- [x] 大運應期輸出補上 `ruleVersion / ruleCode / ruleTier / confidence / evidence`
- [x] 大運時間軸卡片顯示判定依據
- [x] 舊版 `judgeYingQi` 下線為非匯出函式，避免再被誤接

## P1
- [x] 將氣勢、賊捕、做功主線補上 evidence 與 confidence
- [x] 建立五大做功結構的獨立檢測器與一致輸出 schema
- [x] 大運進盤後重算主賓、做功與病藥，不只看單步交互
- [x] 反局、對抗、主功神、輔功神正式模組化

## P2
- [x] 建立固定命例回歸測試集
- [ ] 將文案層與判定層完全分離
- [ ] 清理歷史亂碼與 legacy 註解
- [ ] 建立案例驗收頁與規則版本展示

## Current Rule Policy
- `hard_rule`: 常數表、映射表、干支配對等確定性規則
- `heuristic`: 氣勢門檻、應期模式、賊捕強弱等經驗型規則
- `narrative`: 場景文案、帶象翻譯、類象敘述
- `pending`: 尚未正式接入主流程的規則
