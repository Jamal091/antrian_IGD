export default function CallerLayout({ children }) {
  return (
    <div className="flex flex-col flex-1 overflow-auto bg-[#f0f5f5]">
      {children}
    </div>
  );
}
