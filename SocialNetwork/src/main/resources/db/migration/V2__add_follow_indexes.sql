-- Indexes for user_follows table to optimize Recursive CTE query
-- Run this in MySQL to improve F1-F2-F3 query performance

-- Primary index for follower lookup (most important for the recursive query)
CREATE INDEX IF NOT EXISTS idx_follows_follower ON user_follows(follower_id);

-- Secondary index for following lookup
CREATE INDEX IF NOT EXISTS idx_follows_following ON user_follows(following_id);

-- Composite index for faster joins (optional, for further optimization)
-- CREATE INDEX idx_follows_composite ON user_follows(follower_id, following_id);
