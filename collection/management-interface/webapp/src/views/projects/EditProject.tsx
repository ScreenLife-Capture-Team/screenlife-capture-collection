import { Dialog, Button, Flex, Text, TextField } from "@radix-ui/themes";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { app } from "../../client";

type FormData = {
  id: string;
};

type Props = {
  initialData?: FormData;
};

export default function EditProject(props: Props) {
  const queryClient = useQueryClient();

  const {
    register,
    formState: { errors },
    handleSubmit,
    setValue,
    control,
  } = useForm<FormData>({
    defaultValues: {
      id: props.initialData?.id || "",
    },
  });

  const submit = async (data: FormData) => {
    try {
      if (props.initialData?.id) {
        await app.service("projects").patch(props.initialData?.id, data);
        alert("Project edited!");
        queryClient.refetchQueries({ queryKey: ["projects"] });
        document.getElementById("close-button")?.click();
      } else {
        await app.service("projects").create(data);
        alert("Project added!");
        queryClient.refetchQueries({ queryKey: ["projects"] });
        document.getElementById("close-button")?.click();
      }
    } catch (err: any) {
      alert(err);
    }
  };

  return (
    <Flex direction="column" gap="2">
      <Dialog.Title>
        {props.initialData?.id ? "Edit" : "Add"} Project
      </Dialog.Title>

      <Flex direction="column" gap="3">
        <Flex direction="column" align="start" gap="1">
          <Text size="2">Project ID</Text>
          <TextField.Input {...register("id", { required: true })} />
          {errors?.id && (
            <Text size="2" color="red">
              {errors.id.type}
            </Text>
          )}
        </Flex>
      </Flex>

      <Flex justify="end" gap="4" align="center">
        <Dialog.Close>
          <Button type="button" variant="ghost" id="close-button">
            Close
          </Button>
        </Dialog.Close>
        <Button onClick={handleSubmit(submit)}>Submit</Button>
      </Flex>
    </Flex>
  );
}
