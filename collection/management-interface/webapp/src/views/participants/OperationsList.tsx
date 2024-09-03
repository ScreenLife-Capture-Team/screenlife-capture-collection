import {
  Badge,
  Box,
  Button,
  Card,
  Flex,
  IconButton,
  Separator,
  Text,
} from "@radix-ui/themes";
import { useEffect, useState } from "react";
import { app } from "../../client";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircledIcon,
  MinusIcon,
  PlusIcon,
  ReloadIcon,
} from "@radix-ui/react-icons";

export default function OperationsList() {
  const { data, refetch } = useQuery({
    queryKey: ["operations"],
    queryFn: () =>
      app.service("operations").find({ query: { $sort: { createdAt: -1 } } }),
  });

  const [open, setOpen] = useState(true);

  if (!data) return <></>;

  return (
    <Flex direction="column" style={{ overflowY: "auto", height: "100%" }}>
      <Flex
        justify="between"
        align="center"
        style={{ backgroundColor: "#FAFAFA" }}
        p="2"
      >
        <Text size="4" weight="bold">
          Logs
        </Text>
        {/* {open ? (
          <IconButton
            size="1"
            variant="ghost"
            onClick={() => setOpen(false)}
            m="2"
          >
            <MinusIcon />
          </IconButton>
        ) : (
          <IconButton size="1" variant="soft" onClick={() => setOpen(true)}>
            <PlusIcon />
          </IconButton>
        )} */}
      </Flex>
      {!!open && (
        <Flex direction="column" gap="2">
          <Separator size="4" />
          {data?.data?.map((operation) => (
            <Flex
              key={operation.id}
              gap="2"
              justify="between"
              align="center"
              ml="2"
              mr="4"
            >
              <Flex direction="column">
                <Text>{operation.description}</Text>
                <Flex gap="2" align="center">
                  <Text size="2" color="gray">
                    {new Date(operation.createdAt).toLocaleString()}
                  </Text>
                  {!!operation.message && (
                    <Separator orientation="vertical" size="1" />
                  )}
                  <Text size="2">{operation.message}</Text>
                </Flex>
              </Flex>
              {operation.status === "completed" && (
                <CheckCircledIcon color="var(--green-10)" width={30} />
              )}
              {operation.status === "processing" && <ReloadIcon width={30} />}
            </Flex>
          ))}
        </Flex>
      )}
    </Flex>
  );
}
