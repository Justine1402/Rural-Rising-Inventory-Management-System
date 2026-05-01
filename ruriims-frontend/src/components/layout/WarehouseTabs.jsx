const isAdmin = true;

const ADMIN_TABS = [
  'All Warehouses',
  'Quezon City Warehouse',
  'Alabang Warehouse',
  'Mandaluyong Warehouse',
];

const MANAGER_TABS = [
  'Quezon City Warehouse',
];

export default function WarehouseTabs() {
  const tabs = isAdmin ? ADMIN_TABS : MANAGER_TABS;

  return (
    <div className="flex justify-center gap-3 px-6 py-4">
      {tabs.map((tab, index) => (
        <button
          key={tab}
          className={
            index === 0
              ? 'bg-[#409645] text-white text-sm font-medium px-5 py-2 rounded transition-colors'
              : 'bg-white text-[#1A381E] border border-[#1A381E] text-sm font-medium px-5 py-2 rounded transition-colors hover:bg-green-50'
          }
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
