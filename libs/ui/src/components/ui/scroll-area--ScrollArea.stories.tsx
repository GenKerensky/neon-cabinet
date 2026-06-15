import type { Meta, StoryObj } from "@storybook/react-vite";
import { ScrollArea } from "./scroll-area";
import { expect } from "storybook/test";

const meta = {
  component: ScrollArea,
  title: "ScrollArea",
} satisfies Meta<typeof ScrollArea>;
export default meta;

type Story = StoryObj<typeof ScrollArea>;

export const Primary: Story = {
  args: {},
};

export const Heading: Story = {
  args: {},
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/ScrollArea/gi)).toBeTruthy();
  },
};
