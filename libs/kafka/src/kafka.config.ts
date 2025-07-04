export const KafkaTopics = {
  PostCreated: 'post-created',
  MessageLiked: 'message-liked',
  UserCreated: 'user-created',
  PostReposted: 'post-reposted',
  UserFollowed: 'user-followed',
  UserLoggedIn: 'user-logedin',
} as const;

export type KafkaTopic = (typeof KafkaTopics)[keyof typeof KafkaTopics];
