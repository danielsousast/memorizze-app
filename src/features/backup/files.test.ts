import { Directory, File } from "expo-file-system";
import * as Sharing from "expo-sharing";

import { deleteBackupFile, shareBackupFile, writeBackupFile } from "./files";

jest.mock("expo-sharing", () => ({ shareAsync: jest.fn().mockResolvedValue(undefined) }));
jest.mock("expo-file-system", () => {
  const dirs: { exists: boolean; delete: jest.Mock; create: jest.Mock }[] = [];
  const files: { uri: string; exists: boolean; create: jest.Mock; write: jest.Mock; delete: jest.Mock }[] = [];
  return {
    __dirs: dirs,
    __files: files,
    Paths: { cache: "file:///cache/" },
    Directory: jest.fn().mockImplementation(() => {
      const dir = { exists: true, delete: jest.fn(), create: jest.fn() };
      dirs.push(dir);
      return dir;
    }),
    File: jest.fn().mockImplementation((...parts: unknown[]) => {
      const last = parts[parts.length - 1];
      const file = {
        uri: typeof last === "string" && parts.length === 1 ? last : `file:///cache/backups/${String(last)}`,
        exists: true,
        create: jest.fn(),
        write: jest.fn(),
        delete: jest.fn(),
      };
      files.push(file);
      return file;
    }),
  };
});

const { __dirs: dirs, __files: files } = jest.requireMock("expo-file-system");

describe("backup files", () => {
  beforeEach(() => {
    dirs.length = 0;
    files.length = 0;
    jest.mocked(Directory).mockClear();
    jest.mocked(File).mockClear();
    jest.mocked(Sharing.shareAsync).mockClear();
  });

  it("BKP-24 clears the previous export before writing the new file in the cache", () => {
    const uri = writeBackupFile("memorizze-2026-10-10.json", '{"a":1}');

    expect(Directory).toHaveBeenCalledWith("file:///cache/", "backups");
    expect(dirs[0].delete.mock.invocationCallOrder[0]).toBeLessThan(dirs[0].create.mock.invocationCallOrder[0]);
    expect(files[0].write).toHaveBeenCalledWith('{"a":1}');
    expect(uri).toBe("file:///cache/backups/memorizze-2026-10-10.json");
  });

  it("BKP-24 does not delete a directory that is not there", () => {
    jest.mocked(Directory).mockImplementationOnce(() => {
      const dir = { exists: false, delete: jest.fn(), create: jest.fn() };
      dirs.push(dir);
      return dir as unknown as Directory;
    });
    writeBackupFile("x.json", "{}");
    expect(dirs[0].delete).not.toHaveBeenCalled();
    expect(dirs[0].create).toHaveBeenCalled();
  });

  it("CONTRACT shares the file as JSON", async () => {
    await shareBackupFile("file:///cache/backups/x.json");
    expect(Sharing.shareAsync).toHaveBeenCalledWith("file:///cache/backups/x.json", {
      mimeType: "application/json",
      UTI: "public.json",
    });
  });

  it("BKP-21 deletes a temp file that exists and ignores one that does not", () => {
    deleteBackupFile("file:///cache/backups/x.json");
    expect(files[0].delete).toHaveBeenCalled();

    jest.mocked(File).mockImplementationOnce(() => {
      const file = { uri: "u", exists: false, delete: jest.fn() };
      files.push(file as never);
      return file as unknown as File;
    });
    deleteBackupFile("u");
    expect(files[1].delete).not.toHaveBeenCalled();
  });
});
