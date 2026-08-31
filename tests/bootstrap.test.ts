import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ initialize: vi.fn(), listen: vi.fn(), createApp: vi.fn() }));

vi.mock("../data-source", () => ({ default: { initialize: mocks.initialize } }));
vi.mock("../app", () => ({ createApp: mocks.createApp }));

import { bootstrap } from "../server";

describe("bootstrap lifecycle", () => {
  beforeEach(() => {
    mocks.initialize.mockReset();
    mocks.listen.mockReset();
    mocks.createApp.mockReset().mockReturnValue({ listen: mocks.listen });
  });

  it("does not create or listen when database initialization fails", async () => {
    mocks.initialize.mockRejectedValue(new Error("connection failed"));
    await expect(bootstrap()).rejects.toThrow("connection failed");
    expect(mocks.createApp).not.toHaveBeenCalled();
    expect(mocks.listen).not.toHaveBeenCalled();
  });

  it("listens only after database initialization succeeds", async () => {
    mocks.initialize.mockResolvedValue(undefined);
    await bootstrap();
    expect(mocks.initialize).toHaveBeenCalledTimes(1);
    expect(mocks.createApp).toHaveBeenCalledTimes(1);
    expect(mocks.listen).toHaveBeenCalledTimes(1);
  });
});
