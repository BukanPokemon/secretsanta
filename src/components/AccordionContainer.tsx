interface AccordionContainerProps {
  children: React.ReactNode;
}

export function AccordionContainer({ children }: AccordionContainerProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-h-[70vh] flex flex-col">
      {children}
    </div>
  );
} 