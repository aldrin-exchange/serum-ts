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
  rewardEventQueue: PublicKey;
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

    srm: new PublicKey('8kSodHgaRdMCv8q5GEGiQi1ZknHjMN8bA6vszJwa4Y4k'),
    msrm: new PublicKey('5KsKoWUGMH3HaA1peYDamgtCyHy657iKtJKb837teubq'),
    god: new PublicKey('22aTXdUHcrAGbqNQYqAej8CzbtTmmP4HCAf9scH8BdhU'),
    megaGod: new PublicKey('CHhfbKzdiMZHBqNbutnqdMWd2B65GLwmccTnufpR9MZG'),
    registryProgramId: new PublicKey(
      '3F7wc2FTjH1cUKjSC1exx6whvymnRJL7DXPUmxdJyba5',
    ),
    stakeProgramId: new PublicKey(
      '4HpLCmkFC5LDJTuJVDWYoUgHxpqaYTmUAnCUREns5tHe',
    ),
    lockupProgramId: new PublicKey(
      '7D8BYZo12HQKPMhrXf4mJDyQ1b6emquQ14tiP9yx7Bpx',
    ),
    retbufProgramId: new PublicKey(
      'shmem4EWT2sPdVGvTZCzXXRAURL9G5vpPxNwSeKhHUL',
    ),
    metaEntityProgramId: new PublicKey(
      'Fzht2rymtc6W9NofHnxnhvZD8dc8CihbnhfGc4Lu6XtY',
    ),
    registrar: new PublicKey('A1Qeou7x69auhy1nSkMcvr1hh2cJTCotKKpujxFuQocL'),
    rewardEventQueue: new PublicKey(
      'MM6j5E5zbanQofZeDYp14Wvivw3BUVNgN3NUJ4AXLHG',
    ),
    safe: new PublicKey('2Lp4gPjho7r9we84xHD2hpRKAQDauF5sdZyXxTsfWQWn'),
    retbuf: new PublicKey('69zeA9UJW5sbtg3d8k75m1HNvQzT8ahQdnZnSUdaRawU'),
    defaultEntity: new PublicKey(
      '698ZS6tsutrcDNmEwXzdbDTxM2YkSMNU1ygHyG2eDpSx',
    ),
  },

  // Fill in with your local cluster addresses.
  localhost: {
    // Cluster.
    label: 'Localhost',
    url: 'http://localhost:8899',
    explorerClusterSuffix: 'localhost',

    srm: new PublicKey('9XPYhVJbsJ2jYxfAaqprkKsg3vxwonMTGW65aFrtetqe'),
    msrm: new PublicKey('FdNSpYwMbWkJvP4grWyu46bhezwERaWSeWfwrwMLWSRv'),
    god: new PublicKey('58yxntSCLt1ptim9ZUhouMticU7SLkn94ZaLfJT7tJeH'),
    megaGod: new PublicKey('55NdtCUviJgDaxtE7dkHP6ko6pWAUrgTMGvoCMXQLBuJ'),
    registryProgramId: new PublicKey(
      '9hxzsUakWugUKPKtX5dXp3RhZMZKYNZbHE57U53hGyED',
    ),
    stakeProgramId: new PublicKey(
      '5tm8nErBBsVdPB3xLMAx9pmcigNrrQ529r6VDR15rHTn',
    ),
    lockupProgramId: new PublicKey(
      '8TV9qqPcxUnA1BVbVM8AL9Sag1xXpUtGsWrdZ4ydTz96',
    ),
    retbufProgramId: new PublicKey(
      'shmem4EWT2sPdVGvTZCzXXRAURL9G5vpPxNwSeKhHUL',
    ),
    metaEntityProgramId: new PublicKey(
      '7RVupXnqWNPLMmHHAUQNQpYb6CPGLEwHr5PSX9n7WrNK',
    ),
    registrar: new PublicKey('3zpCSezLu39Ujrsh2kzaRPgd2Cz6PWz1rWZM27wXjhYm'),
    rewardEventQueue: new PublicKey(
      'E31DfbTm6oPfZ4CUB21qHkG3hHMSpTAH1HYBivVtN5ou',
    ),
    safe: new PublicKey('Ag83ki4m4mqqQm1bGdeZkeLNGKwfhVhnDmF6ok6oME2X'),
    retbuf: new PublicKey('5w6dXvYAKqoWn3txkenNXf3YyuDyeA53czdiedWdoXCu'),
    defaultEntity: new PublicKey(
      'Da1osHV5Si3uFezg6L4wPoxLBsZFaE7eD1YXJk4MNZ49',
    ),
  },
};
