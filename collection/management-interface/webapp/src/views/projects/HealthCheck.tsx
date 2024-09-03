"use client";
import {
  Badge,
  Card,
  Flex,
  Grid,
  Heading,
  Separator,
  Text,
  Tooltip,
} from "@radix-ui/themes";
import { useQuery } from "@tanstack/react-query";
import { app } from "../../client";

function Inner() {
  const { data } = useQuery({
    queryKey: ["health-check"],
    queryFn: () => app.service("health").find(),
  });
  if (!data) return <Text>Loading..</Text>;
  return (
    <Grid columns="3">
      <Flex direction="column" gap="1">
        <Heading size="4">Cloud Functions</Heading>
        {data.cloudFunctions.list.map((cf) => (
          <Text size="2" color="gray">
            {cf.name}{" "}
            <Badge color={cf.reachable ? "green" : "red"}>
              {cf.reachable ? "OK" : "Unreachable"}
            </Badge>
          </Text>
        ))}
        <Text size="2" color="gray" mt="2">
          Common Base URL{" "}
          <Tooltip
            content={
              data.cloudFunctions.commonBaseUrl ||
              "Check that all Cloud Functions are deployed to the same project and region"
            }
          >
            <Badge color={data.cloudFunctions.commonBaseUrl ? "green" : "red"}>
              {data.cloudFunctions.commonBaseUrl ? "OK" : "Invalid"}
            </Badge>
          </Tooltip>
        </Text>
      </Flex>
      <Flex direction="column" gap="1">
        <Heading size="4">Cloud Firestore</Heading>
        <Text size="2" color="gray">
          ID: <Badge color="gray">{data.datastore.id}</Badge>
        </Text>
        <Text size="2" color="gray">
          Status:{" "}
          <Badge color={data.datastore.reachable ? "green" : "red"}>
            {data.datastore.reachable ? "OK" : "Unreachable"}
          </Badge>
        </Text>
      </Flex>
      <Flex direction="column" gap="1">
        <Heading size="4">Cloud Storage</Heading>
        <Text size="2" color="gray">
          ID: <Badge color="gray">{data.storage.bucketId}</Badge>
        </Text>
        <Text size="2" color="gray">
          Status:{" "}
          <Badge color={data.storage.reachable ? "green" : "red"}>
            {data.storage.reachable ? "OK" : "Unreachable"}
          </Badge>
        </Text>
      </Flex>
    </Grid>
  );
}

export default function HealthCheck() {
  return (
    <Flex direction="column" gap="2">
      <Heading>Health Check</Heading>
      <Card>
        <Inner />
      </Card>
    </Flex>
  );
}
