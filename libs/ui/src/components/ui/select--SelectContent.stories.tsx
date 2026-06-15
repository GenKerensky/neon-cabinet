import type { Meta, StoryObj } from "@storybook/react-vite";
import { SelectContent } from "./select";
import { expect } from "storybook/test";

const meta = {
  component: SelectContent,
  title: "SelectContent",
} satisfies Meta<typeof SelectContent>;
export default meta;

type Story = StoryObj<typeof SelectContent>;

export const Primary: Story = {
  args: {},
};

export const Heading: Story = {
  args: {},
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/SelectContent/gi)).toBeTruthy();
  },
};
