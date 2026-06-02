import type { Meta, StoryObj } from "@storybook/react-vite";
import { ScrollBar } from "./scroll-area";
import { expect } from "storybook/test";

const meta = {
  component: ScrollBar,
  title: "ScrollBar",
} satisfies Meta<typeof ScrollBar>;
export default meta;

type Story = StoryObj<typeof ScrollBar>;

export const Primary: Story = {
  args: {},
};

export const Heading: Story = {
  args: {},
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/ScrollBar/gi)).toBeTruthy();
  },
};
