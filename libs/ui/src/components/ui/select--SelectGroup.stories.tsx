import type { Meta, StoryObj } from "@storybook/react-vite";
import { SelectGroup } from "./select";
import { expect } from "storybook/test";

const meta = {
  component: SelectGroup,
  title: "SelectGroup",
} satisfies Meta<typeof SelectGroup>;
export default meta;

type Story = StoryObj<typeof SelectGroup>;

export const Primary: Story = {
  args: {},
};

export const Heading: Story = {
  args: {},
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/SelectGroup/gi)).toBeTruthy();
  },
};
