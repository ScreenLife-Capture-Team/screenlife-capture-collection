"use client";
import {
  Badge,
  Box,
  Button,
  Callout,
  Card,
  Container,
  ContextMenu,
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
import { useParams } from "next/navigation";
import {
  DotsVerticalIcon,
  ExclamationTriangleIcon,
} from "@radix-ui/react-icons";
import { useEffect, useMemo } from "react";

import "allotment/dist/style.css";

import { eachDayOfInterval, startOfDay } from "date-fns";
import RegisterView from "./RegisterView";
import OperationsList from "./OperationsList";
import { Participant } from "screenlife-collection-management-interface-server";
import { MdiDecryptedCheckOutline } from "../../icons/Decrypted";
import { UilFileDownload } from "../../icons/Downloaded";
import { MdiImagesOutline } from "../../icons/Images";
import { Allotment } from "allotment";

function Entry(props: {
  participant: Participant;
  dayTimestamp: number;
  projectId: string;
}) {
  const manifests =
    props.participant.manifests?.filter(
      (m) => startOfDay(m.createdAt).getTime() === props.dayTimestamp
    ) || [];
  const finishedManifests = manifests.filter((m) => m.status === "finished");
  const downloaded = manifests.filter((m) => m.downloaded).length;
  const totalNum = manifests
    .filter((m) => m.status === "finished")
    .reduce((a, m) => (a += m.imagesNum || 0), 0);
  const decryptedNum = manifests.reduce(
    (a, m) => (a += m.decryptedNum || 0),
    0
  );

  return (
    <Card
      style={{
        userSelect: "none",
        cursor: manifests.length ? "pointer" : "default",
        opacity: manifests.length ? 1 : 0.2,
        pointerEvents: manifests.length ? "all" : "none",
      }}
    >
      <Dialog.Root>
        <ContextMenu.Root>
          <ContextMenu.Trigger>
            <Dialog.Trigger>
              <Flex direction="column" justify="between" gap="2">
                <Tooltip content="Images Uploaded">
                  <Flex align="center" gap="2">
                    <MdiImagesOutline fontSize={22} />
                    <Text size="5">{totalNum}</Text>
                  </Flex>
                </Tooltip>

                <Flex direction="row" gap="2">
                  <Tooltip content="Manifests Downloaded">
                    <Badge size="1" color="gray" style={{ cursor: "pointer" }}>
                      <UilFileDownload fontSize={14} /> {downloaded}/
                      {finishedManifests.length}
                    </Badge>
                  </Tooltip>
                  <Tooltip content="Decrypted">
                    <Badge size="1" color="gray" style={{ cursor: "pointer" }}>
                      <MdiDecryptedCheckOutline fontSize={14} /> {decryptedNum}/
                      {totalNum}
                    </Badge>
                  </Tooltip>
                </Flex>
              </Flex>
            </Dialog.Trigger>
          </ContextMenu.Trigger>
          <Dialog.Content style={{ maxWidth: "80vw" }}>
            <Dialog.Title mb="4">
              Manifests for <Text color="grass">{props.participant.id}</Text> on{" "}
              <Text color="grass">
                {new Date(props.dayTimestamp).toLocaleDateString()}
              </Text>{" "}
            </Dialog.Title>

            <Table.Root variant="surface">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell>Manifest ID</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Images</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Downloaded</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>
                    Decrypted Images
                  </Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Created At</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {manifests?.map((manifest) => (
                  <Table.Row>
                    <Table.Cell>
                      <Text size="1">{manifest.id}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge
                        color={manifest.status === "active" ? "gray" : "green"}
                      >
                        {manifest.status}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <Text size="1">{manifest.imagesNum || 0}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={manifest.downloaded ? "green" : "gray"}>
                        {manifest.downloaded ? "Yes" : "No"}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <Text size="1">
                        {manifest.decryptedNum} / {manifest.imagesNum || 0}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text size="1">
                        {new Date(manifest.createdAt).toLocaleString()}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Flex align="end" justify="center">
                        <DropdownMenu.Root>
                          <DropdownMenu.Trigger>
                            <IconButton variant="ghost" size="2">
                              <DotsVerticalIcon />
                            </IconButton>
                          </DropdownMenu.Trigger>
                          <DropdownMenu.Content>
                            <DropdownMenu.Item
                              onClick={() => {
                                app.service("operations").create({
                                  description: `Download images in manifest ${manifest.id}`,
                                  payload: {
                                    action: "download",
                                    params: {
                                      projectId: props.projectId as string,
                                      participantId: props.participant.id,
                                      manifestId: manifest.id,
                                    },
                                  },
                                });
                              }}
                            >
                              Download
                            </DropdownMenu.Item>
                            <DropdownMenu.Item
                              onClick={() => {
                                app.service("operations").create({
                                  description: `Decrypt images in manifest ${manifest.id}`,
                                  payload: {
                                    action: "decrypt",
                                    params: {
                                      projectId: props.projectId as string,
                                      participantId: props.participant.id,
                                      manifestId: manifest.id,
                                    },
                                  },
                                });
                              }}
                            >
                              Decrypt
                            </DropdownMenu.Item>
                          </DropdownMenu.Content>
                        </DropdownMenu.Root>
                      </Flex>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Dialog.Content>
          <ContextMenu.Content>
            <ContextMenu.Item
              onClick={() => {
                app.service("operations").create({
                  description: `Download images for ${props.participant.id} on ${new Date(props.dayTimestamp).toLocaleDateString()}`,
                  payload: {
                    action: "download",
                    params: {
                      projectId: props.projectId as string,
                      participantId: props.participant.id,
                      dayTimestamp: props.dayTimestamp,
                    },
                  },
                });
              }}
            >
              Download
            </ContextMenu.Item>
            <ContextMenu.Item
              onClick={() => {
                app.service("operations").create({
                  description: `Decrypt images for ${props.participant.id} on ${new Date(props.dayTimestamp).toLocaleDateString()}`,
                  payload: {
                    action: "decrypt",
                    params: {
                      projectId: props.projectId as string,
                      participantId: props.participant.id,
                      dayTimestamp: props.dayTimestamp,
                    },
                  },
                });
              }}
            >
              Decrypt
            </ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu.Root>
      </Dialog.Root>
    </Card>
  );
}

function ParticipantsView() {
  const queryClient = useQueryClient();
  const { projectId } = useParams();

  const { data: raw, isLoading } = useQuery({
    queryKey: ["participants", projectId],
    queryFn: () =>
      app
        .service("participants")
        .find({ query: { projectId: projectId.toString() } }),
  });

  const data = useMemo(() => {
    if (!raw) return [];
    return raw.map((participant) => {
      return {
        ...participant,
        manifests: [
          ...(participant.manifests || []).map((manifest) => ({
            ...manifest,
            day: startOfDay(manifest.createdAt),
          })),
        ],
      };
    });
  }, [raw]);

  const { days } = useMemo(() => {
    let earliest = Date.now();
    for (const participant of data || []) {
      for (const manifest of participant.manifests || []) {
        if (manifest.createdAt < earliest) earliest = manifest.createdAt;
      }
    }

    const earliestDate = startOfDay(earliest);
    const today = startOfDay(Date.now());

    return { days: eachDayOfInterval({ start: earliestDate, end: today }) };
  }, [data]);

  useEffect(() => {
    console.log("data", data);
  }, [data]);

  return (
    <Flex direction="column" gap="4" m="4">
      <Flex direction="column" gap="1">
        <Heading>Participants of {projectId}</Heading>
        <Flex direction="row" justify="between">
          <Flex direction="row" gap="4" align="center">
            <Link href="/projects" color="gray">
              <Text>Projects</Text>
            </Link>
            <Text>{data?.length || 0} participants</Text>
          </Flex>
          <Flex gap="3" align="center">
            <Dialog.Root>
              <Dialog.Trigger>
                <Button>Register Participant</Button>
              </Dialog.Trigger>
              <Dialog.Content>
                <RegisterView projectId={projectId as string} />
              </Dialog.Content>
            </Dialog.Root>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger>
                <IconButton variant="ghost" size="3">
                  <DotsVerticalIcon />
                </IconButton>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content>
                <DropdownMenu.Item
                  onClick={() => {
                    app.service("operations").create({
                      description: `Download for project ${projectId}`,
                      payload: {
                        action: "download",
                        params: { projectId: projectId as string },
                      },
                    });
                  }}
                >
                  Download All
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  onClick={() => {
                    app.service("operations").create({
                      description: `Decrypt for project ${projectId}`,
                      payload: {
                        action: "decrypt",
                        params: { projectId: projectId as string },
                      },
                    });
                  }}
                >
                  Decrypt All Downloaded
                </DropdownMenu.Item>
                <DropdownMenu.Separator />
                <DropdownMenu.Item
                  color="red"
                  onClick={async () => {
                    const result = confirm(
                      `Are you sure you want to delete project ${projectId}?\nThis action cannot be undone.`
                    );
                    if (result) {
                      // await app
                      //   .service("participants")
                      //   .remove(participant.id, {
                      //     query: { projectId: projectId as string },
                      //   });
                      // await queryClient.refetchQueries({
                      //   queryKey: ["participants"],
                      // });
                      // alert("Participant deleted");
                    }
                  }}
                >
                  Delete
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          </Flex>
        </Flex>
      </Flex>
      {(!data || data.length === 0) && (
        <Callout.Root color="gray">
          <Callout.Text>
            {isLoading ? "Loading.." : "No participants available"}
          </Callout.Text>
        </Callout.Root>
      )}
      {!!data?.length && (
        <Table.Root variant="surface">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>No.</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Participant Id</Table.ColumnHeaderCell>
              {days.map((day, i) => (
                <Table.ColumnHeaderCell key={i}>
                  {day.toLocaleDateString()}
                </Table.ColumnHeaderCell>
              ))}
              <Table.ColumnHeaderCell></Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {data?.map((participant, i) => (
              <Table.Row key={participant.id}>
                <Table.Cell>{i + 1}</Table.Cell>
                <Table.Cell style={{ width: 180 }}>
                  <Tooltip content={participant.verified ? "" : "Not verified"}>
                    <Badge color={participant.verified ? undefined : "red"}>
                      <Flex gap="2">
                        {participant.id}
                        {!participant.verified && <ExclamationTriangleIcon />}
                      </Flex>
                    </Badge>
                  </Tooltip>
                </Table.Cell>
                {days.map((day, i) => (
                  <Table.ColumnHeaderCell key={i}>
                    <Flex direction="column" align="start" gap="1">
                      <Entry
                        participant={participant}
                        projectId={projectId as string}
                        dayTimestamp={day.getTime()}
                      />
                    </Flex>
                  </Table.ColumnHeaderCell>
                ))}
                <Table.Cell>
                  <Flex direction="row" gap="4">
                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger>
                        <IconButton variant="ghost">
                          <DotsVerticalIcon />
                        </IconButton>
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Content>
                        <DropdownMenu.Item
                          onClick={() => alert(participant.deviceMeta)}
                        >
                          Show Device Info
                        </DropdownMenu.Item>
                        <DropdownMenu.Separator />

                        <DropdownMenu.Item
                          onClick={() => {
                            app.service("operations").create({
                              description: `Download for participant ${participant.id}`,
                              payload: {
                                action: "download",
                                params: {
                                  projectId: projectId as string,
                                  participantId: participant.id,
                                },
                              },
                            });
                          }}
                        >
                          Download All
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                          onClick={() => {
                            app.service("operations").create({
                              description: `Decrypt for participant ${participant.id}`,
                              payload: {
                                action: "decrypt",
                                params: {
                                  projectId: projectId as string,
                                  participantId: participant.id,
                                },
                              },
                            });
                          }}
                        >
                          Decrypt All Downloaded
                        </DropdownMenu.Item>
                        <DropdownMenu.Separator />
                        <DropdownMenu.Item
                          color="red"
                          onClick={async () => {
                            const result = confirm(
                              `Are you sure you want to delete participant ${participant.id}?\nThis action cannot be undone.`
                            );
                            if (result) {
                              await app
                                .service("participants")
                                .remove(participant.id, {
                                  query: { projectId: projectId as string },
                                });
                              await queryClient.refetchQueries({
                                queryKey: ["participants"],
                              });
                              alert("Participant deleted");
                            }
                          }}
                        >
                          Delete
                        </DropdownMenu.Item>
                      </DropdownMenu.Content>
                    </DropdownMenu.Root>
                  </Flex>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      )}
    </Flex>
  );
}

export default function ListView() {
  return (
    <Box
      style={{
        height: "100vh",
        maxHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Allotment vertical>
        <Allotment.Pane>
          <div style={{ overflowY: "auto", height: "100%" }}>
            <ParticipantsView />
          </div>
        </Allotment.Pane>
        <Allotment.Pane preferredSize={240} minSize={42}>
          <OperationsList />
        </Allotment.Pane>
      </Allotment>
    </Box>
  );
}
