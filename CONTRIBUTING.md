# Contributing Guide

Thank you for considering contributing to the E-Commerce application! This guide will help you get started.

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what is best for the community
- Show empathy towards others

## How to Contribute

### Reporting Bugs

Before creating a bug report:
1. Check existing issues to avoid duplicates
2. Collect information about the bug
3. Provide steps to reproduce

**Bug Report Template:**
```
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g., Ubuntu 22.04]
- Python Version: [e.g., 3.11]
- Browser: [e.g., Chrome 120]
```

### Suggesting Features

**Feature Request Template:**
```
**Feature Description**
Clear description of the feature.

**Use Case**
Why is this feature needed?

**Proposed Solution**
How should this feature work?

**Alternatives**
Other solutions you've considered.
```

### Pull Requests

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
4. **Test thoroughly**
5. **Commit with clear messages**
   ```bash
   git commit -m "Add feature: description"
   ```
6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```
7. **Create Pull Request**

### Pull Request Guidelines

- One feature/fix per PR
- Update documentation if needed
- Add tests for new features
- Follow existing code style
- Ensure all tests pass
- Write clear commit messages

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/ecommerce.git
cd ecommerce

# Add upstream remote
git remote add upstream https://github.com/ORIGINAL_OWNER/ecommerce.git

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up development database
python init_db.py
python add_sample_data.py

# Run application
python app.py
```

## Code Style

### Python Code
- Follow PEP 8 style guide
- Use meaningful variable names
- Add docstrings to functions/classes
- Keep functions focused and small
- Use type hints where appropriate

**Example:**
```python
def calculate_total(items: list) -> float:
    """
    Calculate total price for order items.
    
    Args:
        items: List of order items
        
    Returns:
        Total price as float
    """
    return sum(item.price * item.quantity for item in items)
```

### HTML/CSS
- Use Bootstrap classes consistently
- Follow existing template structure
- Maintain responsive design
- Add comments for complex sections

### JavaScript
- Use modern ES6+ syntax
- Add comments for complex logic
- Follow existing patterns
- Ensure cross-browser compatibility

## Database Changes

If you need to modify database schema:

1. **Document changes** in PR description
2. **Provide migration script** if needed
3. **Update models** accordingly
4. **Update schema.sql** reference file
5. **Test with existing data**

## Testing

### Manual Testing
Before submitting PR:
- [ ] Test all modified features
- [ ] Test on different browsers
- [ ] Check mobile responsiveness
- [ ] Verify no console errors
- [ ] Test edge cases

### Writing Tests
If adding tests (future enhancement):
```python
def test_user_registration():
    """Test user registration functionality"""
    # Test implementation
    pass
```

## Documentation

Update documentation when:
- Adding new features
- Changing existing behavior
- Modifying API endpoints
- Adding dependencies
- Changing configuration

Files to update:
- README.md - Main documentation
- DEPLOYMENT.md - Deployment changes
- TESTING.md - Test procedures
- Code comments - Inline documentation

## Commit Message Guidelines

Use clear, descriptive commit messages:

**Format:**
```
Type: Brief description (50 chars or less)

Longer explanation if needed. Wrap at 72 characters.
Explain what and why, not how.

- Bullet points are okay
- Use present tense ("Add feature" not "Added feature")
```

**Types:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance tasks

**Examples:**
```
feat: Add product image upload functionality

fix: Resolve cart quantity update issue
Fixes #123

docs: Update installation instructions for Windows

refactor: Simplify order processing logic
```

## Review Process

1. **Automated checks** run on PR
2. **Maintainer review** - may request changes
3. **Discussion** - address feedback
4. **Approval** - once ready
5. **Merge** - by maintainer

## Getting Help

- Open a discussion for questions
- Check existing documentation
- Ask in pull request comments
- Review similar past PRs

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (MIT License).

## Recognition

Contributors will be:
- Listed in project contributors
- Credited in release notes
- Acknowledged in documentation

---

Thank you for contributing! 🎉
