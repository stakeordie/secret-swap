interface TokenProps {
  to: string;
  selectedTo: Record<string, any>;
  contracts: Array<any>;
  createViewingKey: (
    address: string,
    contract: Record<string, any>,
    type: "From" | "To"
  ) => void;
  onSelectChange: (e: any, type: "From" | "To") => void;
  onInputChange: (e: any, typo: "From" | "To") => void;
}

const ToToken = ({
  to,
  contracts,
  selectedTo,
  createViewingKey,
  onSelectChange,
  onInputChange,
}: TokenProps) => {
  return (
    <>
      <h3> To </h3>
      <label htmlFor="">
        {selectedTo.contract ? (
          selectedTo?.token?.balance ? (
            `Balance: ${selectedTo?.token?.balance}`
          ) : (
            <button
              type="button"
              onClick={() =>
                createViewingKey(
                  selectedTo.token.address,
                  selectedTo.contract,
                  "To"
                )
              }
            >
              Create Viewing Key
            </button>
          )
        ) : (
          "Balance: 0"
        )}
      </label>
      <select name="select-to" onChange={(e) => onSelectChange(e, "To")}>
        <option value="" />
        {contracts.map(({ token }, i) => (
          <option key={`To-${i}`} value={token.address}>
            {token.name}
          </option>
        ))}
      </select>
      <input
        value={to}
        type="number"
        placeholder="0"
        onChange={(e) => onInputChange(e, "To")}
      />
    </>
  );
};

export default ToToken;
