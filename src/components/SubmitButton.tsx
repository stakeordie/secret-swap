interface SubmitButtonProps {
  from: string;
  to: string;
  selectedFrom: Record<string, any>;
  selectedTo: Record<string, any>;
  selectedPair: Record<string, any>;
}

const SubmitButton = ({
  from,
  to,
  selectedFrom,
  selectedTo,
  selectedPair,
}: SubmitButtonProps) => {
  return (
    <button
      type="submit"
      disabled={
        !from ||
        !to ||
        !selectedFrom.contract ||
        !selectedTo.contract ||
        !selectedPair.contract
      }
    >
      Swap
    </button>
  );
};

export default SubmitButton;
