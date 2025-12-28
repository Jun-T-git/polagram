interface TabsProps {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function Tabs({ tabs, activeTab, onTabChange }: TabsProps) {
  return (
    <div className="flex border-b border-white/5 bg-background">
      {tabs.map((tab) => (
        <button
          key={tab}
          className={`
            px-4 py-2 text-xs font-mono transition-colors border-r border-white/5
            ${activeTab === tab 
              ? 'bg-muted/30 text-white font-medium border-b-2 border-b-primary' 
              : 'text-muted-foreground hover:text-white hover:bg-white/5'}
          `}
          onClick={() => onTabChange(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
