import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge } from "./badge";
import { expect } from "storybook/test";

const meta = {
  component: Badge,
  title: "Badge",
} satisfies Meta<typeof Badge>;
export default meta;

type Story = StoryObj<typeof Badge>;

export const Primary: Story = {
  args: {},
};

export const Heading: Story = {
  args: {},
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/Badge/gi)).toBeTruthy();
  },
};
