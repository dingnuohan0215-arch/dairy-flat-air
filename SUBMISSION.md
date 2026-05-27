# Submission Checklist

1. Deploy the project to Vercel.
2. Put the deployed URL in the assignment comments, for example:

```text
https://dairy-flat-air.vercel.app
```

3. Upload `AI_STATEMENT.md`.
4. Upload a project archive that excludes hidden files and `node_modules`.

From the folder above the project:

```bash
tar --exclude='node_modules' --exclude='.*' -cvzf dairy-flat-air.tar dairy-flat-air/
```

Or with zip:

```bash
zip -r dairy-flat-air.zip dairy-flat-air -x "dairy-flat-air/node_modules/*" -x "dairy-flat-air/.*"
```
