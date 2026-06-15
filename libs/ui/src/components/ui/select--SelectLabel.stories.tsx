import type { Meta, StoryObj } from "@storybook/react-vite";
import { SelectLabel } from "./select";
import { expect } from "storybook/test";

const meta = {
  component: SelectLabel,
  title: "SelectLabel",
} satisfies Meta<typeof SelectLabel>;
export default meta;

type Story = StoryObj<typeof SelectLabel>;

export const Primary: Story = {
  args: {},
};

export const Heading: Story = {
  args: {},
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/SelectLabel/gi)).toBeTruthy();
  },
};
