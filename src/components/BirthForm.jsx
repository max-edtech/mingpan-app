import { useState } from 'react';

export default function BirthForm({ input, onChange }) {
  const [yearStr, setYearStr] = useState(String(input.year ?? ''));
  const update = (key, val) => onChange(prev => ({ ...prev, [key]: val }));

  function handleYearChange(event) {
    const raw = event.target.value;
    setYearStr(raw);
    const val = parseInt(raw, 10);
    if (val >= 1900 && val <= 2100) update('year', val);
  }

  function handleYearBlur(event) {
    const val = parseInt(event.target.value, 10);
    if (val >= 1900 && val <= 2100) {
      setYearStr(String(val));
      update('year', val);
    } else {
      setYearStr(String(input.year));
    }
  }

  const zhis = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  // 子時跨午夜：0時=子、1-2=丑、…、21-22=亥、23=子（次日）
  const HOUR_ZHI_IDX = [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 0];
  const hours = Array.from({ length: 24 }, (_, i) => ({
    val: i,
    label: `${String(i).padStart(2, '0')}時（${zhis[HOUR_ZHI_IDX[i]]}時）`,
  }));

  return (
    <div className="birth-form">
      <div className="form-row">
        <div className="form-group">
          <label className="field-label">姓名</label>
          <input
            className="text-input"
            value={input.name ?? ''}
            onChange={event => update('name', event.target.value)}
            placeholder="可留空"
          />
        </div>
        <div className="form-group">
          <label className="field-label">性別</label>
          <div className="radio-group">
            {[
              ['male', '男'],
              ['female', '女'],
            ].map(([value, label]) => (
              <label key={value} className={`radio-btn ${input.gender === value ? 'active' : ''}`}>
                <input
                  type="radio"
                  value={value}
                  checked={input.gender === value}
                  onChange={() => update('gender', value)}
                  hidden
                />
                {label}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="field-label">出生年</label>
          <input
            className="text-input"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={yearStr}
            onChange={handleYearChange}
            onBlur={handleYearBlur}
            placeholder="1900-2100"
          />
        </div>
        <div className="form-group">
          <label className="field-label">月</label>
          <select
            className="text-input"
            value={input.month}
            onChange={event => update('month', parseInt(event.target.value, 10))}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
              <option key={month} value={month}>
                {month} 月
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="field-label">日</label>
          <select
            className="text-input"
            value={input.day}
            onChange={event => update('day', parseInt(event.target.value, 10))}
          >
            {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
              <option key={day} value={day}>
                {day} 日
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="field-label">時辰</label>
          <select
            className="text-input"
            value={input.hour}
            onChange={event => update('hour', parseInt(event.target.value, 10))}
          >
            {hours.map(hour => (
              <option key={hour.val} value={hour.val}>
                {hour.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
