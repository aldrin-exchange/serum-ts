import { PublicKey } from '@solana/web3.js';

type Networks = { [label: string]: Network };

export type Network = {
  label: string;
  // Cluster.
  url: string;
  explorerClusterSuffix: string;

  // Mints and god accounts.
  srm: PublicKey;
  msrm: PublicKey;
  god: PublicKey;
  megaGod: PublicKey;

  // Programs.
  registryProgramId: PublicKey;
  stakeProgramId: PublicKey;
  lockupProgramId: PublicKey;
  retbufProgramId: PublicKey;
  metaEntityProgramId: PublicKey;

  // Program accounts.
  safe: PublicKey;
  registrar: PublicKey;
  retbuf: PublicKey;

  // Misc.
  defaultEntity: PublicKey;
};

export const networks: Networks = {
  devnet: {
    // Cluster.
    label: 'Devnet',
    url: 'https://devnet.solana.com',
    explorerClusterSuffix: 'devnet',

    srm: new PublicKey('GDp4uj2AEpLXGNB8XfhTmEoVqf6mjVogDGVXNQJLVdG6'),
    msrm: new PublicKey('HHYkTUAzJhtjFT5KFEYKKgX9KCtH7BbeU4nc6MiK7QcC'),
    god: new PublicKey('A7zthzwSy2mvawsh9iZ4ZBWoJcSh9rWJHBRqEUhuZNpc'),
    megaGod: new PublicKey('6E9d8fwLMvpx69VwMEJk66p2xBM2FH8BdmGqC5xuShZQ'),
    registryProgramId: new PublicKey(
      'Ey3BtpN8DRYkEfGhGWoM1okjUBoHJVncUCgUQEob6E69',
    ),
    stakeProgramId: new PublicKey(
      'Em8gyRs9MJUt4ZwvVAXGYxxha5S1xQLSioR7XDBUYKgw',
    ),
    lockupProgramId: new PublicKey(
      '3ApjLSkfM7rDJ3U6929egK49X3fEAH5YVHuptNzproya',
    ),
    retbufProgramId: new PublicKey(
      '3w2Q6XjS2BDpxHVRzs8oWbNuH7ivZp1mVo3mbq318oyG',
    ),
    metaEntityProgramId: new PublicKey(
      '2iJpXV9dPG8tgbDP131cS8k5v8bB2PYTePkJYFYwPmWQ',
    ),
    registrar: new PublicKey('8cE6mZPnjXrMF4jseFRbaeuhhwkuT5pZ9rC8PSvGbt5N'),
    safe: new PublicKey('DFWAJ4d2umnJURge4NKvgE9pkFQDMjGYvQDP51Bcfqzf'),
    retbuf: new PublicKey('CDSgpFyCZZ9f7dbwcLvozC8wAhaQn9Q5QurKBETHG6ch'),
    defaultEntity: new PublicKey(
      'B6LeSRhTE1okUt5iHF9J7P6om2zADL8ZPvF7KffrbR9U',
    ),
  },

  // Fill in with your local cluster addresses.
  localhost: {
    // Cluster.
    label: 'Localhost',
    url: 'http://localhost:8899',
    explorerClusterSuffix: 'localhost',

    srm: new PublicKey('J8MxjFzNtQhWsb5poYJyKz9TaLpqvG3taCEYvk2qUhdj'),
    msrm: new PublicKey('5DyEMj22jnQXBySH8AwT6aDVmwRmhQHE7fg6oaZseyjx'),
    god: new PublicKey('Dk8n91SsTcbVFi6dQJxhTMdZZnTkQ8KrMhUb4PJaBafa'),
    megaGod: new PublicKey('DqgCVmW8EjqGrwT5MmQaC3y39nuoy6cspDttGveYRNMa'),
    registryProgramId: new PublicKey(
      'Gjj9VcfrxcWWSSEvKkLHz7gPGMMH4yZQhrdUVtXyGTz1',
    ),
    stakeProgramId: new PublicKey(
      'HAte1JY5NeDFnNhLahUizGak9cmEwfAjLzYAntjWZXu5',
    ),
    lockupProgramId: new PublicKey(
      '9PA4MdzStgtbm4JjXhaCsYtMXxFX1LyQKcQehNGqY19X',
    ),
    retbufProgramId: new PublicKey(
      'shmem4EWT2sPdVGvTZCzXXRAURL9G5vpPxNwSeKhHUL',
    ),
    metaEntityProgramId: new PublicKey(
      'Dbn1QraLp4rKdqGhqGtYduxE3UpXbp63Tu6gWk8pyRvj',
    ),
    registrar: new PublicKey('BrsgVHuzUGWwECH2MbDHQr9aN2JPKXm6jnq5sdcuUJnP'),
    safe: new PublicKey('FhxDSfLGhTh637vPrgh9tkAtKjaqobfkyE7XaRQHARDV'),
    retbuf: new PublicKey('dUKXGUGisVcPtCkpsKRFSBpMtprdAXiFjteE2Z2dFd8'),
    defaultEntity: new PublicKey(
      'FYFfyZygQTz6GyKGRrExs4AL2KZyZ3xFceRK19vpHUKt',
    ),
  },
};
