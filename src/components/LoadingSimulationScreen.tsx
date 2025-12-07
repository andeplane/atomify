import { Progress, Spin } from "antd";
import styled from "styled-components";

interface LoadingSimulationScreenProps {
  status?: {
    title: string;
    text: string;
    progress: number;
  };
  wasmReady: boolean;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  color: #ffffff;
  background-color: #1a1b1f;
`;

const StatusText = styled.div`
  margin-top: 24px;
  font-size: 18px;
  text-align: center;
`;

const StatusTitle = styled.div`
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 8px;
`;

const StatusSubtext = styled.div`
  font-size: 14px;
  color: #888;
  margin-top: 8px;
`;

const LoadingSimulationScreen = ({ status, wasmReady }: LoadingSimulationScreenProps) => {
  const displayTitle =
    status?.title || (wasmReady ? "Loading simulation..." : "Initializing simulation engine...");
  const displayText = status?.text || "";
  const progress = status?.progress ?? 0;

  return (
    <Container>
      <Spin size="large" />
      <StatusText>
        <StatusTitle>{displayTitle}</StatusTitle>
        {displayText && <div>{displayText}</div>}
        {progress > 0 && (
          <Progress
            strokeColor={{
              from: "#108ee9",
              to: "#87d068",
            }}
            percent={Math.ceil(100 * progress)}
            status="active"
            style={{ marginTop: 16, maxWidth: 400 }}
          />
        )}
        {!wasmReady && (
          <StatusSubtext>Please wait while the simulation engine loads...</StatusSubtext>
        )}
      </StatusText>
    </Container>
  );
};

export default LoadingSimulationScreen;
