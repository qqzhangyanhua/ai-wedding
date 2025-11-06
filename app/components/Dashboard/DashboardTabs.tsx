interface Tab {
  id: string;
  label: string;
  count: number;
}

interface DashboardTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function DashboardTabs({ tabs, activeTab, onTabChange }: DashboardTabsProps) {
  return (
    <div className="flex border-b border-stone/10">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === tab.id
              ? 'border-dusty-rose text-dusty-rose'
              : 'border-transparent text-stone hover:text-navy'
          }`}
        >
          {tab.label}
          <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs bg-champagne rounded-full">
            {tab.count}
          </span>
        </button>
      ))}
    </div>
  );
}

