"use client";

import {
  Badge,
  Button,
  Callout,
  Container,
  Dialog,
  DropdownMenu,
  Flex,
  Heading,
  IconButton,
  Link,
  Table,
  Text,
  Tooltip,
} from "@radix-ui/themes";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { app } from "../../client";
import { useRouter } from "next/navigation";
import { DotsVerticalIcon } from "@radix-ui/react-icons";
import EditProject from "./EditProject";
import { Project } from "screenlife-collection-management-interface-server";
import { useEffect, useState } from "react";
import HealthCheck from "./HealthCheck";

function Row({ d, i }: { d: Project; i: number }) {
  const queryClient = useQueryClient();
  const [dialog, setDialog] = useState<"" | "edit">("");

  return (
    <Table.Row key={d.id}>
      <Table.Cell style={{ width: 40 }}>
        <Text>{i + 1}</Text>
      </Table.Cell>
      <Table.Cell style={{ width: 180 }}>
        <Link href={`/projects/${d.id}`}>{d.id}</Link>
      </Table.Cell>
      <Table.Cell>
        <Text>{d.participants?.length}</Text>
      </Table.Cell>
      <Table.Cell>
        <Flex gap="4">
          <DropdownMenu.Root modal={false}>
            <DropdownMenu.Trigger>
              <IconButton variant="ghost">
                <DotsVerticalIcon />
              </IconButton>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content>
              <DropdownMenu.Item onClick={() => setDialog("edit")}>
                Edit
              </DropdownMenu.Item>
              <DropdownMenu.Item
                color="red"
                onClick={async () => {
                  const result = confirm(
                    `Are you sure you want to delete project ${d.id}?\nThis action cannot be undone.`
                  );
                  if (result) {
                    await app.service("projects").remove(d.id);
                    await queryClient.refetchQueries({
                      queryKey: ["projects"],
                    });
                    alert("Project deleted");
                  }
                }}
              >
                Delete
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
          <Dialog.Root
            open={dialog === "edit"}
            onOpenChange={() => setDialog("")}
          >
            <Dialog.Content>
              <EditProject initialData={d} />
            </Dialog.Content>
          </Dialog.Root>
        </Flex>
      </Table.Cell>
    </Table.Row>
  );
}

export default function ListView() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { data, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => app.service("projects").find(),
  });

  return (
    <Container m="4">
      <Flex direction="column" align="stretch" gap="4">
        <Heading size="8">ScreenLife Capture Management Interface</Heading>

        <HealthCheck />

        <Flex direction="column">
          <Heading>Projects</Heading>
          <Flex direction="row" justify="between">
            <Text>{data?.length || 0} projects</Text>
            <Dialog.Root>
              <Dialog.Trigger>
                <Button>Add Project</Button>
              </Dialog.Trigger>
              <Dialog.Content>
                <EditProject />
              </Dialog.Content>
            </Dialog.Root>
          </Flex>
        </Flex>
        {(!data || data.length === 0) && (
          <Callout.Root color="gray">
            <Callout.Text>
              {isLoading ? "Loading.." : "No projects available"}
            </Callout.Text>
          </Callout.Root>
        )}
        {!!data?.length && (
          <Table.Root variant="surface">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>No.</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Project Id</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Participants</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell></Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {data?.map((d, i) => <Row key={i} d={d} i={i} />)}
            </Table.Body>
          </Table.Root>
        )}
      </Flex>
    </Container>
  );
}
