import { Dimmer, Loader } from "semantic-ui-react";

const Loading = (props: { loading: boolean }) => {
  if (!props.loading) return <></>;

  return (
    <Dimmer active>
      <Loader className="center" size="massive">
        Loading
      </Loader>
    </Dimmer>
  );
};

export default Loading;
