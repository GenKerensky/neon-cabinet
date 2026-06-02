import type { Meta, StoryObj } from "@storybook/react-vite";
import { TooltipContent } from "./tooltip";
import { expect } from "storybook/test";

const meta = {
  component: TooltipContent,
  title: "TooltipContent",
} satisfies Meta<typeof TooltipContent>;
export default meta;

type Story = StoryObj<typeof TooltipContent>;

export const Primary: Story = {
  args: {},
};

export const Heading: Story = {
  args: {},
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/TooltipContent/gi)).toBeTruthy();
  },
};
