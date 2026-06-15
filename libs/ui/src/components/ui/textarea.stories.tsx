import type { Meta, StoryObj } from "@storybook/react-vite";
import { Textarea } from "./textarea";
import { expect } from "storybook/test";

const meta = {
  component: Textarea,
  title: "Textarea",
} satisfies Meta<typeof Textarea>;
export default meta;

type Story = StoryObj<typeof Textarea>;

export const Primary: Story = {
  args: {},
};

export const Heading: Story = {
  args: {},
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/Textarea/gi)).toBeTruthy();
  },
};
