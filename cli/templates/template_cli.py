import typer
import shlex
from pathlib import Path
from rich.progress import Progress, SpinnerColumn, TextColumn

from db import connect_db

class TemplateCLI():
    def __init__(self):
        # init typer app and db connection
        self.app = typer.Typer()
        self.conn = connect_db()
        
        # register commands
        self.app.command('create')(self.create)
        self.app.command('delete')(self.delete)
        self.app.command('list')(self.list)
        self.app.command('update')(self.update)
        self.cur = self.conn.cursor()
        
        # get all template tags for validation
        template_tags = self.cur.execute("SELECT id, tag FROM template_tags").fetchall()
        self.template_tags = template_tags if template_tags else []
    
    # main loop for the CLI
    def shell(self):
        while True:
            try:
                input_command = str(input(">> "))
                input_command = shlex.split(input_command)
                if input_command[0] in ['exit', 'quit']:
                    break
                try:
                    self.app(input_command)
                except SystemExit as se:
                    if se.code != 0:
                        print(f"Command failed with exit code {se.code}")
            except KeyboardInterrupt:
                print("\nExiting...")
                break
            except Exception as e:
                print(f"Error processing command: {e}")
    
    def _is_valid_template_type(self, type):
        return type in ['email', 'in-app']
    
    def _get_template_tag_id(self, tag):
        for id, existing_tag in self.template_tags:
            if existing_tag == tag:
                return id
        return None
    
    def _list_template_tags(self):
        for id, tag in self.template_tags:
            typer.echo(f"- {tag} (ID: {id})")
    
    def create(self):
        try:
            tag = typer.prompt("Template tag?")
            tag_id = self._get_template_tag_id(tag)
            
            if not tag_id:
                typer.echo("Invalid tag. Please choose from the following tags:", err=True)
                self._list_template_tags()
                return
            
            type = typer.prompt("Template type?")
            if not self._is_valid_template_type(type):
                typer.echo("Type must be 'email' or 'in-app'.", err=True)
                return
            
            self.cur.execute("SELECT id FROM templates WHERE type = %s AND tag_id = %s", (type, tag_id))
            existing_template = self.cur.fetchone()
            if existing_template:
                typer.echo("Template with this tag and type already exists. Update the template instead.", err=True)
                return
            
            filepath = typer.prompt("Template file path (HTML template file)?")
            
            if not Path(filepath).is_file():
                typer.echo("File does not exist.", err=True)
                return
            
            file_ext = Path(filepath).suffix
            if file_ext.lower() != '.html':
                typer.echo("File must be an HTML template.", err=True)
                return
            
            with open(filepath, 'r') as file:
                content = file.read()
                if not content.strip():
                    typer.echo("Template file cannot be empty.", err=True)
                    return
            
            with Progress(
                SpinnerColumn(),
                TextColumn("[progress.description]{task.description}"),
                transient=True,
            ) as progress:
                progress.add_task(description="Creating template...", total=None)

                curr = self.cur.execute("INSERT INTO templates (tag_id, type, content) VALUES (%s, %s, %s) RETURNING id", (tag_id, type, content))
                template_id = curr.fetchone()[0]
                self.conn.commit()
                typer.echo(f"\nTemplate created with ID: {template_id}")
        except Exception as e:
            typer.echo(f"Error creating template: {e}", err=True)
    
    def delete(self):
        try:
            id = typer.prompt("Template ID?")
            
            typer.confirm(f"Are you sure you want to delete template with ID {id}?", abort=True)
            
            self.cur.execute("DELETE FROM templates WHERE id = %s", (id,))
            self.conn.commit()
            typer.echo("Template deleted successfully.")
        except Exception as e:
            typer.echo(f"Error deleting template: {e}", err=True)
    
    def list(self):
        try:
            tag = typer.prompt("Tag?")
            tag_id = self._get_template_tag_id(tag)
            
            if not tag_id:
                typer.echo("Invalid tag. Please choose from the following tags:", err=True)
                self._list_template_tags()
                return
            
            self.cur.execute("SELECT t.id, t.type, tt.tag FROM templates t inner join template_tags tt on t.tag_id = tt.id WHERE t.tag_id = %s", (tag_id,))
            templates = self.cur.fetchall()
            for template in templates:
                typer.echo(f"Template ID: {template[0]}, Type: {template[1]}, Tag: {template[2]}")
        except Exception as e:
            typer.echo(f"Error listing templates: {e}", err=True)
    
    def update(self):
        try:
            template_id = typer.prompt("Template ID?")
            filepath = typer.prompt("New template file path (HTML template file)?")
            
            if not Path(filepath).is_file():
                typer.echo("File does not exist.", err=True)
                return
            
            if Path(filepath).suffix.lower() != '.html':
                typer.echo("File must be an HTML template.", err=True)
                return
            
            with open(filepath, 'r') as file:
                content = file.read()
                if not content.strip():
                    typer.echo("Template file cannot be empty.", err=True)
                    return
            
            with Progress(
                SpinnerColumn(),
                TextColumn("[progress.description]{task.description}"),
                transient=True,
            ) as progress:
                progress.add_task(description="Updating template...", total=None)

                self.cur.execute("UPDATE templates SET content = %s WHERE id = %s", (content, template_id))
                self.conn.commit()
                typer.echo("\nTemplate updated successfully.")
        except Exception as e:
            typer.echo(f"Error updating template: {e}", err=True)
