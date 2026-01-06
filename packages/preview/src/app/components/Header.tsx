interface HeaderProps {
  isDark: boolean;
  onToggleDark: () => void;
}

export default function Header({ isDark, onToggleDark }: HeaderProps) {
  return (
    <header className="header">
      <div className="header-title">
        <span>📘</span>
        <span>Polagram Spec</span>
      </div>
      <button
        type="button"
        className="header-toggle"
        onClick={onToggleDark}
        title="Toggle theme"
      >
        {isDark ? '☀️' : '🌙'}
      </button>
    </header>
  );
}
