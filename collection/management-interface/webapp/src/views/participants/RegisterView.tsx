import {
  Badge,
  Button,
  Dialog,
  Flex,
  Text,
  TextArea,
  TextField,
} from "@radix-ui/themes";
import { useEffect, useState } from "react";
import { app } from "../../client";
import QRCode from "react-qr-code";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function RegisterView(props: { projectId: string }) {
  const [participantId, setParticipantId] = useState("");
  const [loading, setLoading] = useState(false);

  const [qr, setQr] = useState("");
  const [showRaw, setShowRaw] = useState(false);

  const { data } = useQuery({
    queryKey: ["participant", participantId, props.projectId],
    queryFn: () =>
      app
        .service("participants")
        .get(participantId, { query: { projectId: props.projectId } }),
    enabled: !!qr && !!participantId,
    refetchInterval: 5000, // 5s
  });
  console.log("data part", data, participantId);

  const queryClient = useQueryClient();
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["participant"] });
    queryClient.invalidateQueries({ queryKey: ["participants"] });
  }, [data?.verified]);

  const toggleRaw = () => {
    setShowRaw((r) => !r);
  };

  const submit = async () => {
    setLoading(true);
    try {
      const result = await app.service("register").create({
        projectId: props.projectId,
        participantId,
      });
      setQr(result.qrString);
    } catch (err: any) {
      alert(err?.message || err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!qr ? (
        <Flex direction="column" gap="2" align="start">
          <Text size="5">Participant Registration</Text>
          <TextField.Root>
            <TextField.Input
              placeholder="participant ID"
              value={participantId}
              onChange={(e) => setParticipantId(e.target.value)}
            />
          </TextField.Root>
          <Button onClick={submit} disabled={loading}>
            Submit
          </Button>
        </Flex>
      ) : data?.verified ? (
        <Flex direction="column" gap="2">
          <Flex direction="column">
            <Text size="6">Participant Registration</Text>
          </Flex>
          <Flex align="start">
            <Badge color="green">Participant Verified!</Badge>
          </Flex>
          <Flex justify="end" gap="2">
            <Dialog.Close>
              <Button>Finish</Button>
            </Dialog.Close>
          </Flex>
        </Flex>
      ) : (
        <Flex direction="column" gap="4">
          <Flex direction="column">
            <Text size="6">Participant Registration</Text>
            <Text>Please scan the QR code using the participant's device</Text>
          </Flex>
          {showRaw ? (
            <Flex direction="column">
              <TextArea
                size="1"
                style={{ whiteSpace: "break-spaces", minHeight: 120 }}
              >
                {JSON.stringify(JSON.parse(qr), null, 2)}
              </TextArea>
            </Flex>
          ) : (
            <QRCode
              size={512}
              value={qr}
              level={"H"}
              style={{ alignSelf: "center" }}
            />
          )}
          <Flex justify="end" gap="2">
            <Button variant="outline" onClick={toggleRaw}>
              Toggle Raw
            </Button>
            <Button disabled>Pending Verification</Button>
          </Flex>
        </Flex>
      )}
    </>
  );
}
