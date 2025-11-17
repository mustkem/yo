# Database Migration Quick Reference Card

## 🚀 Most Common Commands

```bash
# Check what needs to be done
npm run migration:status

# Run pending migrations
npm run migration:run

# Rollback last migration
npm run migration:revert

# Create a backup
npm run db:backup

# Restore from backup
npm run db:restore:latest
```

---

## 📋 Daily Workflow

### Making Schema Changes

```bash
# 1. Update entity files (add/remove fields)
# 2. Generate migration
npm run migration:generate MyChangeName

# 3. Review generated migration
# 4. Test locally
npm run migration:test

# 5. Lint the migration
npm run migration:lint

# 6. Run it
npm run migration:run
```

### Before Deployment

```bash
# 1. Create backup
npm run db:backup -- --name="pre-deploy-$(date +%Y%m%d)"

# 2. Check status
npm run migration:status

# 3. Lint all migrations
npm run migration:lint

# 4. Run tests
npm run migration:test
```

### Emergency Rollback

```bash
# 1. Check current state
npm run migration:status

# 2. Rollback last migration
npm run migration:revert

# 3. Verify rollback
npm run migration:status

# 4. If needed, restore from backup
npm run db:restore:latest
```

---

## 🔧 All Available Commands

### Migrations
| Command | What It Does |
|---------|--------------|
| `migration:status` | Shows detailed dashboard |
| `migration:run` | Runs pending migrations |
| `migration:revert` | Undoes last migration |
| `migration:show` | Shows history |
| `migration:generate <name>` | Creates migration from entities |
| `migration:lint` | Checks code quality |
| `migration:test` | Runs test suite |

### Backups
| Command | What It Does |
|---------|--------------|
| `db:backup` | Creates timestamped backup |
| `db:backup:list` | Lists all backups |
| `db:restore -- --file=<name>` | Restores specific backup |
| `db:restore:latest` | Restores newest backup |
| `db:restore:list` | Shows restore options |

### Database
| Command | What It Does |
|---------|--------------|
| `db:seed` | Adds test data |
| `db:reset` | Drop → Migrate → Seed |

---

## ⚡ Quick Checks

```bash
# Are migrations up to date?
npm run migration:status

# Any code issues?
npm run migration:lint

# Tests passing?
npm run migration:test

# Recent backups?
npm run db:backup:list
```

---

## 🆘 Troubleshooting

### Migration Failed

```bash
# 1. Check what happened
npm run migration:status

# 2. Roll it back
npm run migration:revert

# 3. Fix the migration code
# 4. Try again
npm run migration:run
```

### Need to Restore

```bash
# See available backups
npm run db:restore:list

# Restore latest
npm run db:restore:latest

# Or specific backup
npm run db:restore -- --file=backup-name.sql
```

### Lint Errors

```bash
# See issues
npm run migration:lint

# Common fixes:
# - Add down() method
# - Add JSDoc comments
# - Fix SQL injection risks
```

---

## 📝 Quick Tips

1. **Always backup before production migrations**
   ```bash
   npm run db:backup
   ```

2. **Check status before and after**
   ```bash
   npm run migration:status
   ```

3. **Lint before committing**
   ```bash
   npm run migration:lint
   ```

4. **Test in development first**
   ```bash
   npm run migration:test
   ```

5. **Keep backups for 30 days** (automatic)

---

## 🔒 Safety Checklist

Before running migrations in production:

- [ ] Created backup
- [ ] Ran linter (no errors)
- [ ] Ran tests (all passing)
- [ ] Checked status (know what will run)
- [ ] Reviewed migration code
- [ ] Planned rollback strategy
- [ ] Scheduled maintenance window
- [ ] Team notified

---

**Need Help?** See [`database/migrations/README.md`](migrations/README.md) for detailed guide.
