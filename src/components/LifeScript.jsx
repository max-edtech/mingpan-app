/**
 * Tab 4 — 人生劇本（Claude API 生成）
 */
export default function LifeScript({ text, loading, error, onGenerate, hasApiKey }) {
  return (
    <div className="tab-content">
      <div className="section-card">
        <div className="section-title">人生劇本 — AI 解讀</div>
        <p style={{ color:'#9ca3af', fontSize:'0.8rem', margin:'0 0 1rem' }}>
          由 Claude Opus 4.6 根據命盤結構生成自然語言敘事，把命理結構轉化為你的人生畫面。
        </p>

        {!hasApiKey && !loading && !text && (
          <div className="empty-state">
            <div style={{ fontSize:'2rem' }}>🔑</div>
            <p>請先在右上角 <b>⚙ 設定</b> 中填入 Anthropic API Key</p>
            <p style={{ color:'#6b7280', fontSize:'0.8rem' }}>Key 存於本機 localStorage，不上傳伺服器</p>
          </div>
        )}

        {hasApiKey && !loading && !text && !error && (
          <div className="empty-state">
            <div style={{ fontSize:'2rem' }}>✦</div>
            <p>點擊上方「人生劇本」按鈕，或</p>
            <button className="btn-primary large" onClick={onGenerate}>生成我的人生劇本</button>
          </div>
        )}

        {error && (
          <div className="error-box">
            <b>生成失敗：</b>{error}
            <button className="btn-ghost small" onClick={onGenerate} style={{marginLeft:'1rem'}}>重試</button>
          </div>
        )}

        {loading && !text && (
          <div className="loading-state">
            <div className="spinner" />
            <p>Claude 正在解讀你的命盤…</p>
          </div>
        )}

        {text && (
          <div className="script-text">
            {/* 解析 Markdown 標題 */}
            {text.split('\n').map((line, i) => {
              if (line.startsWith('## ')) return <h3 key={i} className="script-h3">{line.slice(3)}</h3>;
              if (line.startsWith('# '))  return <h2 key={i} className="script-h2">{line.slice(2)}</h2>;
              if (line.trim() === '') return <br key={i} />;
              return <p key={i} className="script-p">{line}</p>;
            })}
            {loading && <span className="cursor-blink">▌</span>}
          </div>
        )}

        {text && !loading && (
          <div style={{ marginTop:'1.5rem', display:'flex', gap:'0.75rem' }}>
            <button className="btn-ghost" onClick={onGenerate}>重新生成</button>
            <button className="btn-ghost" onClick={() => navigator.clipboard?.writeText(text)}>複製全文</button>
          </div>
        )}
      </div>
    </div>
  );
}
