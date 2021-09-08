interface TokenProps {
  from: string;
  selectedFrom: Record<string, any>;
  contracts: Array<any>;
  createViewingKey: (
    address: string,
    contract: Record<string, any>,
    type: "From" | "To"
  ) => void;
  onSelectChange: (e: any, type: "From" | "To") => void;
  onInputChange: (e: any, typo: "From" | "To") => void;
}
const FromToken = ({
  from,
  contracts,
  selectedFrom,
  createViewingKey,
  onSelectChange,
  onInputChange,
}: TokenProps) => {
  return (
    <>
      <h3> From </h3>
      <label htmlFor="">
        {selectedFrom.contract ? (
          selectedFrom?.token?.balance ? (
            `Balance: ${selectedFrom?.token?.balance}`
          ) : (
            <button
              type="button"
              onClick={() =>
                createViewingKey(
                  selectedFrom.token.address,
                  selectedFrom.contract,
                  "From"
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
      <select name="select-from" onChange={(e) => onSelectChange(e, "From")}>
        <option value="" />
        {contracts.map(({ token }, i) => (
          <option key={`From-${i}`} value={token.address}>
            {token.name}
          </option>
        ))}
      </select>
      <input
        value={from}
        type="number"
        placeholder="0"
        onChange={(e) => onInputChange(e, "From")}
      />
    </>
  );
};

export default FromToken;
